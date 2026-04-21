/**
 * 管理后台服务端 - 会话审计 API
 * 提供：GET 会话列表/详情（给后台前端）、POST 入库（给 demo 前端上报）、导出/导出明细
 */

import express from 'express';
import cors from 'cors';
import { listSessions, getSessionDetail, ingestSession, updateSessionMeta } from './store.js';
import { getAssistantConfig, updateAssistantConfig } from './assistantConfigStore.js';
import { getIntentSystem, updateIntentSystem, addIntentIteration } from './intentSystemStore.js';
import { getAllSkills, getSkillById, upsertSkill, deleteSkill, syncFromToolbar } from './skillStore.js';
import { getQAKnowledge, updateQAKnowledge, addEvalDataset, addEvalItem, addModelEvaluation } from './qaKnowledgeStore.js';
import { getAgentConfig, updateAgentConfig, addAgentEvalRun } from './agentConfigStore.js';
import {
  ingestToolboxEvent,
  getToolboxMarket,
  getToolboxAppsForExport,
  getToolboxFeedbackForExport,
  getToolboxActivityForExport,
} from './toolboxStore.js';
import { registerKnowledgeBaseRoutes } from './knowledgeBaseRoutes.js';

const app = express();
const PORT = process.env.PORT || 3101;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '35mb' }));

/** 鉴权：管理后台前端会请求 /api/auth/me，无此接口会 404 导致白屏或反复跳登录 */
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const t = token.toLowerCase();
  if (t === 'dev' || t === 'test') {
    return res.json({
      id: 1005,
      name: '调试管理员',
      role: 'admin',
      salesCode: null,
      managedProjects: [],
    });
  }
  res.status(401).json({ error: 'Unauthorized' });
});

const EXPORT_PAGE_SIZE = 50000;

/** 从 query 构建列表筛选项（与列表接口一致），无筛选项即全量 */
function buildFilterFromQuery(req) {
  const filter = {
    page: 1,
    pageSize: EXPORT_PAGE_SIZE,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc',
  };
  if (req.query.keyword) filter.keyword = req.query.keyword;
  if (req.query.dateFrom) filter.dateFrom = req.query.dateFrom;
  if (req.query.dateTo) filter.dateTo = req.query.dateTo;
  if (req.query.rating) filter.rating = req.query.rating;
  if (req.query.skill) filter.skill = req.query.skill;
  if (req.query.projectId) filter.projectId = req.query.projectId;
  return filter;
}

/** CSV 字段转义 */
function escapeCsvField(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/** 导出文件名时间戳 */
function exportTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

// 会话列表（会话审计页）
app.get('/api/admin/sessions', (req, res) => {
  try {
    const filter = {
      keyword: req.query.keyword,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      rating: req.query.rating,
      skill: req.query.skill,
      projectId: req.query.projectId,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
    };
    const { items, total } = listSessions(filter);
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 导出：会话列表 CSV（有筛选项按筛选项导出，无则全量）
app.get('/api/admin/sessions/export', (req, res) => {
  try {
    const filter = buildFilterFromQuery(req);
    const { items } = listSessions(filter);
    const BOM = '\uFEFF';
    const header = ['用户', '会话标题', '消息数', 'Token', '费用(¥)', '评价', 'Skill', '时间'];
    const rows = items.map((s) => [
      escapeCsvField(s.userName),
      escapeCsvField(s.title),
      escapeCsvField(s.messageCount),
      escapeCsvField(s.totalTokens),
      escapeCsvField(s.totalCost != null ? s.totalCost.toFixed(2) : ''),
      escapeCsvField(s.rating === 'up' ? '好评' : s.rating === 'down' ? '差评' : '-'),
      escapeCsvField(s.skill ?? ''),
      escapeCsvField(s.createdAt ? new Date(s.createdAt).toLocaleString('zh-CN') : ''),
    ]);
    const csv = BOM + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `sessions_${exportTimestamp()}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 导出明细：会话 + 每条消息一行 CSV（有筛选项按筛选项，无则全量）
app.get('/api/admin/sessions/export/detail', (req, res) => {
  try {
    const filter = buildFilterFromQuery(req);
    const { items } = listSessions(filter);
    const BOM = '\uFEFF';
    const header = ['会话ID', '用户', '会话标题', '会话时间', '消息序号', '角色', '内容', '消息类型', '消息时间'];
    const rows = [];
    for (const session of items) {
      const detail = getSessionDetail(session.id);
      if (!detail) continue;
      const ms = detail.messages || [];
      const sessionTime = detail.session.createdAt ? new Date(detail.session.createdAt).toLocaleString('zh-CN') : '';
      if (ms.length === 0) {
        rows.push([
          escapeCsvField(detail.session.id),
          escapeCsvField(detail.session.userName),
          escapeCsvField(detail.session.title),
          escapeCsvField(sessionTime),
          escapeCsvField(1),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
          escapeCsvField(''),
        ]);
      } else {
        ms.forEach((m, idx) => {
          rows.push([
            escapeCsvField(detail.session.id),
            escapeCsvField(detail.session.userName),
            escapeCsvField(detail.session.title),
            escapeCsvField(sessionTime),
            escapeCsvField(idx + 1),
            escapeCsvField(m.role === 'user' ? '用户' : '助理'),
            escapeCsvField(m.content),
            escapeCsvField(m.msgType || 'text'),
            escapeCsvField(m.createdAt ? new Date(m.createdAt).toLocaleString('zh-CN') : ''),
          ]);
        });
      }
    }
    const csv = BOM + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `sessions_detail_${exportTimestamp()}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 会话详情
app.get('/api/admin/sessions/:id', (req, res) => {
  try {
    const detail = getSessionDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Session not found' });
    res.json(detail);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// demo 前端上报会话（入库）
app.post('/api/admin/sessions/ingest', (req, res) => {
  try {
    const result = ingestSession(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// 事后更新会话元数据（用量、评价、Skill、项目等）
app.patch('/api/admin/sessions/:id', (req, res) => {
  try {
    const session = updateSessionMeta(req.params.id, req.body || {});
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Skill 列表（OpenClaw 风格：从 skillStore 读取，与 toolbar 合并）
app.get('/api/admin/skills', (req, res) => {
  try {
    const config = getAssistantConfig();
    const fromStore = getAllSkills();
    const toolbarIds = new Set();
    (config.toolbar || []).forEach((item) => {
      (item.skillIds || []).forEach((sid) => toolbarIds.add(sid));
    });
    const byId = Object.fromEntries(fromStore.map((s) => [s.id, s]));
    toolbarIds.forEach((id) => {
      if (!byId[id]) {
        const label = (config.toolbar || []).find((t) => (t.skillIds || []).includes(id))?.label || id;
        byId[id] = { id, name: label, description: '', instructions: '', useWhen: [], doNotUse: [], requires: { env: [], bins: [], config: [] }, triggerExamples: [], requiredApis: [], associatedProjects: [], enabled: true, userInvocable: true, disableModelInvocation: false, updatedAt: new Date().toISOString() };
      }
    });
    res.json(Object.values(byId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/skills/:id', (req, res) => {
  try {
    const skill = getSkillById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/skills/:id', (req, res) => {
  try {
    const item = upsertSkill({ ...req.body, id: req.params.id });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/admin/skills/:id', (req, res) => {
  try {
    const existing = getSkillById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Skill not found' });
    const item = upsertSkill({ ...existing, ...req.body, id: req.params.id });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/skills', (req, res) => {
  try {
    const { id, ...rest } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const item = upsertSkill({ id, ...rest });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/skills/:id', (req, res) => {
  try {
    deleteSkill(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// 公开：供前台助理拉取 Skill 定义（用于注入 LLM Prompt）
app.get('/api/public/skills', (req, res) => {
  try {
    const skills = getAllSkills();
    res.json(skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      instructions: s.instructions,
      useWhen: s.useWhen || [],
      doNotUse: s.doNotUse || [],
      triggerExamples: s.triggerExamples || [],
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- 前台助理配置（欢迎语、意图改写、工具栏+Skills） ----------
// 管理端：获取 / 更新配置
app.get('/api/admin/assistant-config', (req, res) => {
  try {
    res.json(getAssistantConfig());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/assistant-config', (req, res) => {
  try {
    const updated = updateAssistantConfig(req.body || {});
    syncFromToolbar(updated.toolbar || []);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// 公开接口：供前台助理拉取（无需鉴权）
app.get('/api/public/assistant-config', (req, res) => {
  try {
    res.json(getAssistantConfig());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- 意图识别：意图体系、Prompt、迭代优化、多轮对话、意图切换 ----------
app.get('/api/admin/intent-system', (req, res) => {
  try {
    res.json(getIntentSystem());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/intent-system', (req, res) => {
  try {
    res.json(updateIntentSystem(req.body || {}));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/intent-system/iterations', (req, res) => {
  try {
    res.json(addIntentIteration(req.body || {}));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ---------- QA 知识库：问答策略、评估体系、数据评测集、模型效果评估 ----------
app.get('/api/admin/qa-knowledge', (req, res) => {
  try {
    res.json(getQAKnowledge());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/qa-knowledge', (req, res) => {
  try {
    res.json(updateQAKnowledge(req.body || {}));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/qa-knowledge/datasets', (req, res) => {
  try {
    const { name, description, projectId } = req.body || {};
    res.json(addEvalDataset(name || '新评测集', description, projectId));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/qa-knowledge/eval-items', (req, res) => {
  try {
    const { datasetId, question, expectedAnswer, metadata } = req.body || {};
    if (!datasetId || !question) return res.status(400).json({ error: 'datasetId and question required' });
    res.json(addEvalItem(datasetId, question, expectedAnswer || '', metadata));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/qa-knowledge/model-evaluations', (req, res) => {
  try {
    const { datasetId, modelName, metrics, totalCases, passedCases } = req.body || {};
    res.json(addModelEvaluation(datasetId, modelName, metrics, totalCases, passedCases));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ---------- Agent：Plan、Action、能力评估 ----------
app.get('/api/admin/agent-config', (req, res) => {
  try {
    res.json(getAgentConfig());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/agent-config', (req, res) => {
  try {
    res.json(updateAgentConfig(req.body || {}));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/agent-config/eval-runs', (req, res) => {
  try {
    const { scores, metrics } = req.body || {};
    res.json(addAgentEvalRun(scores, metrics));
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// ---------- 百宝箱（前台 ingest + 看板 + 意见箱） ----------
app.post('/api/admin/toolbox/ingest', (req, res) => {
  try {
    ingestToolboxEvent(req.body || {});
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/toolbox/market', (req, res) => {
  try {
    res.json(getToolboxMarket());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 百宝箱：导出应用上架统计 CSV（UTF-8 BOM，便于 Excel）
app.get('/api/admin/toolbox/export/apps', (req, res) => {
  try {
    const apps = getToolboxAppsForExport();
    const BOM = '\uFEFF';
    const header = ['工具ID', '工具名称', '分类', '打开次数', '任务发起', '任务完成', '最近活跃时间'];
    const rows = apps.map((a) => [
      escapeCsvField(a.toolId),
      escapeCsvField(a.toolName),
      escapeCsvField(a.category),
      escapeCsvField(a.opens),
      escapeCsvField(a.jobStarts),
      escapeCsvField(a.jobCompletes),
      escapeCsvField(a.lastAt ? new Date(a.lastAt).toLocaleString('zh-CN') : ''),
    ]);
    const csv = BOM + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `toolbox_apps_${exportTimestamp()}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/toolbox/export/feedback', (req, res) => {
  try {
    const list = getToolboxFeedbackForExport();
    const BOM = '\uFEFF';
    const header = ['提交时间', '意见内容', '联系方式', '端标识'];
    const rows = list.map((f) => [
      escapeCsvField(f.at ? new Date(f.at).toLocaleString('zh-CN') : ''),
      escapeCsvField(f.text),
      escapeCsvField(f.contact || ''),
      escapeCsvField(f.clientHint || ''),
    ]);
    const csv = BOM + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `toolbox_feedback_${exportTimestamp()}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

registerKnowledgeBaseRoutes(app);

app.get('/api/admin/toolbox/export/activity', (req, res) => {
  try {
    const list = getToolboxActivityForExport();
    const BOM = '\uFEFF';
    const header = ['时间', '事件类型', '工具ID', '工具名称', '分类', '任务ID', '进度', '状态', '说明'];
    const rows = list.map((x) => [
      escapeCsvField(x.at ? new Date(x.at).toLocaleString('zh-CN') : ''),
      escapeCsvField(x.type),
      escapeCsvField(x.toolId),
      escapeCsvField(x.toolName),
      escapeCsvField(x.category),
      escapeCsvField(x.jobId ?? ''),
      escapeCsvField(x.progress != null ? x.progress : ''),
      escapeCsvField(x.status ?? ''),
      escapeCsvField(x.message ?? ''),
    ]);
    const csv = BOM + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const filename = `toolbox_activity_${exportTimestamp()}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`管理后台 API: http://localhost:${PORT}（局域网可访问）`);
  console.log('  GET  /api/auth/me                  鉴权（dev/test token 返回管理员）');
  console.log('  GET  /api/admin/sessions           会话列表');
  console.log('  GET  /api/admin/sessions/export     导出（按筛选项或全量）');
  console.log('  GET  /api/admin/sessions/export/detail  导出明细');
  console.log('  GET  /api/admin/sessions/:id        会话详情');
  console.log('  POST /api/admin/sessions/ingest      demo 上报');
  console.log('  PATCH /api/admin/sessions/:id       更新会话元数据');
  console.log('  GET  /api/admin/skills               Skill 列表');
  console.log('  GET  /api/admin/assistant-config     前台配置（管理）');
  console.log('  PUT  /api/admin/assistant-config     更新前台配置');
  console.log('  GET  /api/public/assistant-config     前台配置（公开，供助理拉取）');
  console.log('  GET  /api/admin/intent-system        意图识别配置');
  console.log('  PUT  /api/admin/intent-system        更新意图识别');
  console.log('  GET  /api/admin/qa-knowledge         QA 知识库配置');
  console.log('  PUT  /api/admin/qa-knowledge         更新 QA 知识库');
  console.log('  GET  /api/admin/agent-config         Agent 配置');
  console.log('  PUT  /api/admin/agent-config         更新 Agent 配置');
  console.log('  POST /api/admin/toolbox/ingest       百宝箱埋点/任务上报');
  console.log('  GET  /api/admin/toolbox/market       百宝箱看板');
  console.log('  GET  /api/admin/toolbox/export/apps     百宝箱应用列表 CSV');
  console.log('  GET  /api/admin/toolbox/export/feedback 百宝箱意见箱 CSV');
  console.log('  GET  /api/admin/toolbox/export/activity 百宝箱动态流水 CSV');
  console.log('  [部门知识库] GET/POST /api/admin/kb/*  管理端');
  console.log('  [部门资料/受管/问答] /api/kb/me/*     小仙前台（X-Dept-Ids，含 V1.0.2）');
});
