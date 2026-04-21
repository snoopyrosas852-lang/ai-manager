/**
 * 管理后台 Mock 数据 — 无后端时的本地预览
 */
import type {
  CostOverview,
  CostTrendPoint,
  ModelDistribution,
  SkillDistribution,
  UserRanking,
} from '../types/cost';
import type { SessionListItem, SessionDetail, SessionFilter } from '../types/session';
import type { SkillConfig, ProjectConfig, KnowledgeBaseItem, AdminUser, OrgTreeNode } from '../types/config';
import type { TestCase, TestRunResult } from '../types/testcase';

// ---------------------------------------------------------------------------
// 成本 Mock
// ---------------------------------------------------------------------------

export const MOCK_COST_OVERVIEW: CostOverview = {
  totalCostYuan: 284.56,
  todayCostYuan: 12.34,
  todayTokens: 45600,
  avgSessionCost: 0.042,
  totalSessions: 6780,
  totalMessages: 15200,
};

export function mockCostTrend(days: number): CostTrendPoint[] {
  const points: CostTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      date: d.toISOString().slice(0, 10),
      costYuan: 8 + Math.random() * 25,
      tokens: 2000 + Math.floor(Math.random() * 8000),
    });
  }
  return points;
}

export const MOCK_MODEL_DIST: ModelDistribution[] = [
  { model: 'Qwen-Turbo', calls: 4200, tokens: 850000, costYuan: 85, percentage: 62 },
  { model: 'Qwen-Plus', calls: 1800, tokens: 420000, costYuan: 168, percentage: 26 },
  { model: 'Qwen-Max', calls: 400, tokens: 120000, costYuan: 31.56, percentage: 12 },
];

export const MOCK_SKILL_DIST: SkillDistribution[] = [
  { skill: 'logistics_track', skillName: '物流追踪', calls: 2100, tokens: 520000, costYuan: 125 },
  { skill: 'delivery_confirm', skillName: '交付确认', calls: 980, tokens: 280000, costYuan: 68 },
  { skill: 'order_confirm_alert', skillName: '订单确认预警', calls: 650, tokens: 180000, costYuan: 45 },
];

export const MOCK_USER_RANK: UserRanking[] = [
  { userId: 1001, userName: '李销售', totalTokens: 125000, totalCostYuan: 12.5, sessionCount: 320 },
  { userId: 1002, userName: '王销售', totalTokens: 98000, totalCostYuan: 9.8, sessionCount: 280 },
  { userId: 1003, userName: '张助理', totalTokens: 76000, totalCostYuan: 7.6, sessionCount: 210 },
  { userId: 1004, userName: '刘经理', totalTokens: 52000, totalCostYuan: 5.2, sessionCount: 150 },
  { userId: 1005, userName: '陈销售', totalTokens: 45000, totalCostYuan: 4.5, sessionCount: 120 },
];

// ---------------------------------------------------------------------------
// 会话 Mock
// ---------------------------------------------------------------------------

export const MOCK_SESSION_LIST: SessionListItem[] = [
  {
    id: 'sess-mock-001',
    userId: 1001,
    userName: '李销售',
    title: '本月待交付订单',
    messageCount: 4,
    totalTokens: 1250,
    totalCost: 0.052,
    rating: 'up',
    skill: 'logistics_track',
    projectId: 'cssc',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sess-mock-002',
    userId: 1002,
    userName: '王销售',
    title: '已签收但没回传签收单的',
    messageCount: 6,
    totalTokens: 2100,
    totalCost: 0.089,
    rating: null,
    skill: 'delivery_confirm',
    projectId: 'cssc',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'sess-mock-003',
    userId: 1003,
    userName: '张助理',
    title: '有没有超时没确认的订单',
    messageCount: 4,
    totalTokens: 980,
    totalCost: 0.041,
    rating: 'down',
    skill: 'order_confirm_alert',
    projectId: 'cssc',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export const MOCK_SESSION_DETAIL: SessionDetail = {
  session: {
    id: 'sess-mock-001',
    userId: 1001,
    userName: '李销售',
    title: '本月待交付订单',
    createdAt: new Date().toISOString(),
    totalTokens: 1250,
    totalCost: 0.052,
  },
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: '本月待交付订单',
      msgType: 'text',
      cardData: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: '为您查询到 3 笔待交付/在途订单，其中 1 笔已触碰 3 日发货红线、1 笔临近 5 日妥投红线，请优先处理。',
      msgType: 'order_list',
      cardData: { orders: [], pagination: { pageNo: 1, totalCount: 3 }, variant: 'logistics' },
      createdAt: new Date().toISOString(),
      debug: {
        skill: 'logistics_track',
        intent: 'query_pending_delivery',
        confidence: 0.95,
        extractedParams: { timeRange: '本月', projectId: 'cssc' },
        apiParams: { pageNo: '1', pageSize: '20', state: 'pending_delivery' },
        queryRewrite: '查询本月待交付订单',
        projectId: 'cssc',
        modelUsed: 'Qwen-Turbo',
        inputTokens: 320,
        outputTokens: 180,
        costYuan: 0.025,
        ttftMs: 420,
        totalMs: 1850,
        rawLlmOutput: '{"skill":"logistics_track","intent":"query_pending_delivery","params":{"timeRange":"本月"}}',
        rawApiResponse: { totalCount: 3, dataList: [] },
      },
      feedback: { rating: 'up', createdAt: new Date().toISOString() },
    },
  ],
};

// ---------------------------------------------------------------------------
// 配置 Mock
// ---------------------------------------------------------------------------

export const MOCK_SKILLS: SkillConfig[] = [
  {
    id: 'logistics_track',
    name: '物流追踪',
    description: '查询待交付订单的发货进度，结合考核红线提醒',
    triggerExamples: ['本月待交付', '物流进度', '发货情况'],
    requiredApis: ['order_list', 'docking_sync'],
    associatedProjects: ['cssc'],
    enabled: true,
  },
  {
    id: 'delivery_confirm',
    name: '交付确认',
    description: '查询已签收但未回传签收单的订单',
    triggerExamples: ['签收单', '已签收没回传', '10日红线'],
    requiredApis: ['order_list', 'docking_sync'],
    associatedProjects: ['cssc'],
    enabled: true,
  },
  {
    id: 'order_confirm_alert',
    name: '订单确认预警',
    description: '查询超过24h未确认的预占订单',
    triggerExamples: ['超时未确认', '预占', '24小时'],
    requiredApis: ['order_list', 'docking_sync'],
    associatedProjects: ['cssc'],
    enabled: true,
  },
];

export const MOCK_PROJECTS: ProjectConfig[] = [
  {
    id: 'cssc',
    name: '中船项目',
    shortName: '中船',
    aliases: ['中船', '中船重工', 'CSSC'],
    customerMatchKeywords: ['中船', '船舶', 'CSSC'],
    enabledSkills: ['logistics_track', 'delivery_confirm', 'order_confirm_alert'],
    knowledgeBasePrefix: 'cssc',
    enabled: true,
  },
];

/** 中船考核红线知识库完整内容（11 条红线 + 对话用 promptContext） */
const CSSCC_KB_CONTENT = {
  name: '中船项目考核细则',
  sourceDoc: '中船考核红线（订单确认/物流/对账开票/售后）',
  promptContext: `你正在分析中船项目的订单数据。中船项目有严格的考核红线，回复时请结合以下规则提醒用户：

【订单确认】
1. 预占/正式下单后未在24小时内确认：100元/单违约金 + 情况说明及整改报告；重大投诉协议挂起1-3个月。操作要求：24小时内完成确认，确保15天预占库存期；发货前客户申请取消须3个工作日内处理。
2. 经用户投诉后以库存不足等理由取消已确认订单：500元/单违约金 + 说明及整改报告；重大投诉协议挂起1-3个月。

【物流】
3. 订单生效到上传物流单号超过3个工作日（申诉未通过）：200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。
4. 订单生效到完成妥投超过5个工作日（申诉未通过）：200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。
5. 妥投后10个工作日内未上传签收单(含货物清单)：200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。
6. 提供错误/虚假物流单号或物流信息维护不完善：200元/单 + 说明及整改报告。操作要求：通用产品3个工作日内发货，定制产品第2工作日安排生产；物流从顺丰/德邦/京东/邮政选合作或自营。
7. 提前发货（物流早于下单时间）：1000元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。

【对账开票】
8. 经用户投诉，申请对账距订单验货超过30天：200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。操作要求：每月至少按订单维度对账一次（建议每月15号）。
9. 客户申请开票后10个工作日内未开具与实际业务一致、可认证抵扣的增值税专用发票：200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。

【售后】
10. 经用户投诉，确认商品质量/数量/规格与订单不符、用户要求退换，供应商3个工作日内未处理：500元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。要求：具备完善售后体系（及时响应、上门安装调试、保修退换等）；商品须符合页面质量标准。
11. 经用户投诉，工作时间无法联系到供应商或回复超过24小时影响客户工作：200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月。

在回复订单列表、物流、签收单、预占确认等场景时，请自动检查是否触碰或临近上述红线，并给出违约金风险与处理建议。`,

  redLines: [
    { id: 1, category: '订单确认', scenario: '预占/正式下单后未在24小时内确认', penaltyYuan: 100, penaltyDesc: '100元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: ['24小时内完成确认，15天预占库存期', '发货前客户申请取消须3个工作日内处理', '严格按订单交付，禁止擅自换货或与订单不符'] },
    { id: 2, category: '订单确认', scenario: '经用户投诉后以库存不足等理由取消已确认订单', penaltyYuan: 500, penaltyDesc: '500元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: [] },
    { id: 3, category: '物流', scenario: '订单生效到上传物流单号超过3个工作日且申诉未通过', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: ['通用产品3个工作日内发货', '定制产品第2工作日安排生产', '及时更新平台物流状态；物流选顺丰/德邦/京东/邮政或自营'] },
    { id: 4, category: '物流', scenario: '订单生效到完成妥投超过5个工作日且申诉未通过', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: [] },
    { id: 5, category: '物流', scenario: '妥投后10个工作日内未上传签收单(含货物清单)', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: [] },
    { id: 6, category: '物流', scenario: '提供错误/虚假物流单号或物流信息维护不完善', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: ['商品需支持全国销售并维护出货日、库存', '交付前毁损灭失及瑕疵风险由乙方承担'] },
    { id: 7, category: '物流', scenario: '提前发货(物流流转早于下单时间)', penaltyYuan: 1000, penaltyDesc: '1000元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: [] },
    { id: 8, category: '对账开票', scenario: '经用户投诉，申请对账距订单验货超过30天', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: ['每月至少按订单维度对账一次(建议每月15号)', '90天未收到客户货款可备案后款到发货'] },
    { id: 9, category: '对账开票', scenario: '客户申请开票后10个工作日内未开具一致可抵扣的增值税专票', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: [] },
    { id: 10, category: '售后', scenario: '经用户投诉，商品质量/数量/规格与订单不符且退换要求3个工作日内未处理', penaltyYuan: 500, penaltyDesc: '500元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: ['须具备完善售后体系(响应、安装调试、保修退换)', '商品须符合页面质量标准，国标/行标更高时适用更高标准'] },
    { id: 11, category: '售后', scenario: '经用户投诉，工作时间无法联系或回复超过24小时影响客户工作', penaltyYuan: 200, penaltyDesc: '200元/单 + 说明及整改报告；重大投诉协议挂起1-3个月', guidelines: [] },
  ],

  thresholds: {
    orderConfirmHours: 24,
    orderConfirmPenaltyYuan: 100,
    logisticsShipWorkDays: 3,
    logisticsDeliveredWorkDays: 5,
    receiptUploadWorkDays: 10,
    reconciliationDaysAfterInspection: 30,
    invoiceWorkDays: 10,
    afterSalesProcessWorkDays: 3,
    afterSalesResponseHours: 24,
  },
};

export const MOCK_KB_LIST: KnowledgeBaseItem[] = [
  {
    id: 'kb-cssc',
    projectId: 'cssc',
    name: '中船考核规则',
    description: '中船项目考核红线（订单确认/物流/对账开票/售后 共11条）',
    content: JSON.stringify(CSSCC_KB_CONTENT, null, 2),
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
    status: 'published',
  },
];

/** 咸亨组织树（与用户所属部门对应） */
export const MOCK_ORG_TREE: OrgTreeNode[] = [
  {
    id: 'group',
    name: '咸亨国际科技股份有限公司（集团）',
    children: [
      {
        id: 'xianheng',
        name: '咸亨国际科技股份有限公司',
        children: [
          { id: 'default', name: '默认部门', children: [] },
          { id: 'szcx', name: '数智创新部', children: [] },
          { id: 'xtkf', name: '系统开发部', children: [] },
          { id: 'ddly', name: '订单履约部', children: [] },
          { id: 'xxds', name: '新兴电商履约组', children: [] },
        ],
      },
      {
        id: 'zjxh',
        name: '浙江咸亨创新产业中心有限公司',
        children: [],
      },
    ],
  },
];

export const MOCK_USERS: AdminUser[] = [
  { id: 1001, name: '屈艺', role: 'admin', salesCode: 'xhgj000615', department: '数智创新部', managedProjects: ['cssc'], lastLoginAt: new Date().toISOString() },
  { id: 1002, name: '侯夏琳', role: 'sales', salesCode: 'xhgj001188', department: '系统开发部', managedProjects: ['cssc'], lastLoginAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 1003, name: '邹诚', role: 'sales', salesCode: 'xhgj000423', department: '订单履约部', managedProjects: ['cssc'], lastLoginAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 1004, name: '许海川', role: 'manager', salesCode: 'xhgj000779', department: '数智创新部', managedProjects: ['cssc'], lastLoginAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 1005, name: '刘源泉', role: 'sales_assistant', salesCode: 'xhgj000762', department: '新兴电商履约组', managedProjects: ['cssc'], lastLoginAt: new Date().toISOString() },
  { id: 1006, name: '金卉', role: 'sales', salesCode: 'xhgj000054', department: '订单履约部', managedProjects: [], lastLoginAt: new Date().toISOString() },
  { id: 1007, name: '杜鹏', role: 'operator', salesCode: null, department: '系统开发部', managedProjects: ['cssc'], lastLoginAt: new Date().toISOString() },
  { id: 1008, name: '龚柳婧', role: 'sales', salesCode: 'xhgj001351', department: '数智创新部', managedProjects: ['cssc'], lastLoginAt: new Date().toISOString() },
];

// ---------------------------------------------------------------------------
// 测评 Mock
// ---------------------------------------------------------------------------

export const MOCK_TEST_CASES: TestCase[] = [
  {
    id: 'tc-1',
    group: '物流追踪',
    userMessage: '本月待交付订单',
    projectContext: 'cssc',
    expected: { skill: 'logistics_track', intent: 'query_pending_delivery', params: { timeRange: '本月' } },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tc-2',
    group: '交付确认',
    userMessage: '已签收但没回传签收单的',
    projectContext: 'cssc',
    expected: { skill: 'delivery_confirm', intent: 'query_receipt_pending', params: {} },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const MOCK_TEST_RUNS: TestRunResult[] = [
  {
    id: 'tr-1',
    runAt: new Date().toISOString(),
    totalCases: 10,
    passedCases: 9,
    passRate: 0.9,
    results: [],
  },
];
