"""Execute creator comparisons through the reused analyst sandbox, without a model."""
import flask
import pandas as pd
from data_formulator.analyst.agent import AnalystAgent
from data_formulator.datalake.workspace import Workspace


def test_comparison_and_followup_create_distinct_results_preserving_source(tmp_path):
    app = flask.Flask(__name__)
    app.config['CLI_ARGS'] = {'data_dir': str(tmp_path), 'sandbox': 'local'}
    with app.app_context():
        workspace = Workspace('creator-test', root_dir=tmp_path)
        original = pd.DataFrame({'id': ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'],
                                 'series': ['A', 'A', 'A', 'B', 'B', 'B'],
                                 'saves': [10, 20, 900, 30, 40, 50]})
        workspace.write_parquet(original, 'creator_posts')
        agent = AnalystAgent(client=None, workspace=workspace)
        common = dict(output_variable='result_df',
                      chart_spec={'chart_type': 'bar', 'encodings': {'x': 'series', 'y': 'median_saves'}},
                      field_metadata={}, field_display_names={}, display_instruction='比较收藏', title='收藏中位数')
        source_path = workspace.get_relative_data_file_path("creator_posts")
        prefix = f"import pandas as pd\nposts = pd.read_parquet({source_path!r})\n"
        aggregate = "result_df = posts.groupby('series').agg(median_saves=('saves','median'), sample_count=('id','count')).reset_index()"
        first = agent._run_visualize_code(code=prefix + aggregate, **common)
        assert first['status'] == 'ok', first
        first_result = first['transform_result']
        assert [r['median_saves'] for r in first_result['content']['rows']] == [20.0, 40.0]
        second = agent._run_visualize_code(code=prefix + "posts = posts.sort_values(['saves','id'], ascending=[False,True]).groupby('series').tail(2)\n" + aggregate, **common)
        assert second['status'] == 'ok', second
        second_result = second['transform_result']
        assert [r['median_saves'] for r in second_result['content']['rows']] == [15.0, 35.0]
        assert first_result['content']['virtual']['table_name'] != second_result['content']['virtual']['table_name']
        pd.testing.assert_frame_equal(workspace.read_data_as_df('creator_posts'), original)
