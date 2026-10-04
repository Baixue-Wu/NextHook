export const platformGuides = [
  {
    name: "YouTube",
    state: "官方导出已确认",
    tone: "confirmed",
    url: "https://support.google.com/youtube/answer/9717005?hl=en",
    detail:
      "YouTube Studio → Analytics → Advanced mode / See more → Export current view。选择逐视频表，核对日期和指标。官方说明下载报告最多 500 行；更大规模属于另一个 API 工作流。",
  },
  {
    name: "小红书",
    state: "后台导出待账号核验",
    tone: "pending",
    url: "https://creator.xiaohongshu.com/",
    detail:
      "官方创作服务平台提供数据分析。公开开源项目有“笔记列表明细表.xlsx”的处理案例，但本项目尚未核验当前账号的导出权限、字段和时间范围。拿到表格后可手动映射。",
  },
  {
    name: "抖音",
    state: "文件导出待核验",
    tone: "pending",
    url: "https://creator.douyin.com/",
    detail:
      "普通创作者后台的逐作品文件导出尚未得到官方文档确认。开放平台另有需申请权限和用户授权的视频数据 API，不能等同于免配置下载，首版不接该 API。",
  },
  {
    name: "Instagram",
    state: "Business Suite 路径待核验",
    tone: "pending",
    url: "https://www.facebook.com/business/help/397273916756139",
    detail:
      "Meta Business Suite 的 Insights 是待核验入口。官方帮助页本次访问要求登录，未确认具体账号的 CSV 导出条件；个人信息副本也不等于逐条内容表现表。",
  },
];
