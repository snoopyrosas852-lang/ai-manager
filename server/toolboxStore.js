/**
 * 百宝箱统计与意见箱：由 assistant 上报 ingest 聚合，内存存储（重启清空）
 */

/** @type {Map<string, object>} */
const perTool = new Map();

/** @type {object[]} */
const activity = [];

/** @type {object[]} */
const feedbackList = [];

const ACTIVITY_CAP = 150;
const FEEDBACK_CAP = 100;
const FEEDBACK_TEXT_MAX = 2000;

/**
 * @param {object} body
 */
export function ingestToolboxEvent(body) {
  const { type, toolId, toolName, category, jobId, progress, status, message, at } = body || {};
  const ts = at != null ? Number(at) : Date.now();

  if (type === 'feedback') {
    const text = String(body.text || '').trim();
    if (!text || text.length > FEEDBACK_TEXT_MAX) return;
    const contact = String(body.contact || '').trim().slice(0, 120);
    const clientHint = String(body.clientHint || '').trim().slice(0, 64);
    feedbackList.unshift({ at: ts, text, contact, clientHint });
    if (feedbackList.length > FEEDBACK_CAP) feedbackList.length = FEEDBACK_CAP;
    return;
  }

  if (!toolId) return;

  let row = perTool.get(toolId);
  if (!row) {
    row = {
      toolId,
      toolName: toolName || toolId,
      category: category || 'other',
      opens: 0,
      jobStarts: 0,
      jobCompletes: 0,
      lastAt: ts,
    };
    perTool.set(toolId, row);
  }
  if (toolName) row.toolName = toolName;
  if (category) row.category = category;
  row.lastAt = ts;

  if (type === 'open_tool') row.opens += 1;
  if (type === 'job_start') row.jobStarts += 1;
  if (type === 'job_complete') row.jobCompletes += 1;

  activity.unshift({
    at: ts,
    type: type || 'unknown',
    toolId,
    toolName: row.toolName,
    category: row.category,
    jobId,
    progress,
    status,
    message,
  });
  if (activity.length > ACTIVITY_CAP) activity.length = ACTIVITY_CAP;
}

function sortApps(apps) {
  return [...apps].sort(
    (a, b) =>
      b.opens - a.opens || b.jobStarts - a.jobStarts || (b.lastAt || 0) - (a.lastAt || 0),
  );
}

export function getToolboxMarket() {
  const apps = sortApps(Array.from(perTool.values()));
  const totals = apps.reduce(
    (acc, a) => {
      acc.opens += a.opens;
      acc.jobStarts += a.jobStarts;
      acc.jobCompletes += a.jobCompletes;
      return acc;
    },
    { opens: 0, jobStarts: 0, jobCompletes: 0 },
  );
  return {
    apps,
    totals,
    activity: activity.slice(0, 50),
    feedback: feedbackList.slice(0, 50),
  };
}

/** 导出用：全部应用统计（内存中全量） */
export function getToolboxAppsForExport() {
  return sortApps(Array.from(perTool.values()));
}

/** 导出用：全部意见（内存中全量，最多 FEEDBACK_CAP 条） */
export function getToolboxFeedbackForExport() {
  return [...feedbackList];
}

/** 导出用：全部动态流水（内存中全量，最多 ACTIVITY_CAP 条） */
export function getToolboxActivityForExport() {
  return [...activity];
}
