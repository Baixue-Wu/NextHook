# Official creator data export audit

Checked 2026-10-04. A downloadable personal-data archive, an on-screen analytics dashboard, and a per-content performance export are different capabilities. No private creator account was accessed during this audit. The application uses generic user-confirmed mapping, not native platform connectors.

| Platform | Evidence and official entry | What is confirmed | What remains unverified |
| --- | --- | --- | --- |
| YouTube | [Advanced mode help](https://support.google.com/youtube/answer/9717005?hl=en) | Studio → Analytics → Advanced mode / See more → Export current view. Channel/video metrics can be exported; the help page states a 500-row download limit. | Exact current CSV headers across languages and selected reports; no real account file was tested. Choose a per-video table, not a daily channel chart. |
| Instagram | [Business Suite best practices](https://www.facebook.com/business/help/397273916756139), [desktop Insights](https://www.facebook.com/business/help/700570830721044), [Instagram Insights](https://help.instagram.com/788388387972460) | These are the relevant official help entry points. | Official pages returned login/temporary-block/429 responses. Business Suite → Insights → export is a plausible path reported by other sources, not independently verified here. Account eligibility, file format, columns and windows remain open. |
| Xiaohongshu | [Creator platform](https://creator.xiaohongshu.com/) | The official public entry advertises creator data analysis. | No accessible official documentation confirming the current bulk Excel export, account permissions or fields. [xhs-trail](https://github.com/DeanThompson/xhs-trail) documents consuming 笔记列表明细表.xlsx, but is an independent implementation, not a platform guarantee. |
| Douyin | [Creator platform](https://creator.douyin.com/), [official video base-data API](https://open.douyin.com/platform/resource/docs/openapi/data-open-service/video-data/get-basic-data/) | The official API describes permission `data.external.item`, user authorization, only the authorized user's videos, and videos created within 30 days. | This API is not a manual download channel. Ordinary-creator bulk CSV/Excel export was not verified from accessible official documentation. Third-party tutorials were not accepted as official evidence. |

## Product consequences

- File import avoids needing platform API approval, but does not make the user's data-acquisition problem disappear.
- Preserve account, platform, metric and observation-window context. A current cumulative value cannot reconstruct historical daily performance.
- Do not imply that privacy-account exports contain creator performance metrics.
- Do not interchange Instagram reach, impressions and views, or account follower totals and content-attributed new follows.
- YouTube supports [theme/style groups and comparisons itself](https://support.google.com/youtube/answer/16766491?hl=en). A generic comparison chart is not a unique capability of NextHook.
- Next validation: obtain an authorized sample export with its screen/report settings, record headers and semantics, and add a fixture-based adapter only after that evidence exists.

## Access limitations

YouTube help and Douyin API documentation were readable through official search/open results. Meta help was login-gated or rate-limited. Xiaohongshu's public creator page does not expose signed-in analytics documentation. Failure to verify an export is not proof that the platform lacks it. No alternate account login, bypass, scraping or third-party credential service was used.
