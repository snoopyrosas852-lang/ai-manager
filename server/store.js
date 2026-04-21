/**
 * 会话审计存储 - 基于 JSON 文件，无需数据库
 * 数据目录：./data/audit.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'audit.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function read() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) {
    return { sessions: [], messagesBySession: {} };
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { sessions: [], messagesBySession: {} };
  }
}

function write(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/** 会话行：与 SessionListItem 对齐 */
export function listSessions(filter = {}) {
  const { sessions, messagesBySession } = read();
  let list = sessions.map((s) => ({
    ...s,
    messageCount: (messagesBySession[s.id] || []).length,
  }));

  if (filter.keyword) {
    const k = filter.keyword.toLowerCase();
    list = list.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(k)) ||
        (s.userName && s.userName.toLowerCase().includes(k))
    );
  }
  if (filter.dateFrom) {
    list = list.filter((s) => s.createdAt >= filter.dateFrom);
  }
  if (filter.dateTo) {
    list = list.filter((s) => s.createdAt <= filter.dateTo + 'T23:59:59.999Z');
  }
  if (filter.rating) {
    list = list.filter((s) => (s.rating || 'none') === filter.rating);
  }
  if (filter.skill) list = list.filter((s) => s.skill === filter.skill);
  if (filter.projectId) list = list.filter((s) => s.projectId === filter.projectId);

  const sortBy = filter.sortBy || 'createdAt';
  const order = filter.sortOrder || 'desc';
  list.sort((a, b) => {
    const va = a[sortBy];
    const vb = b[sortBy];
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return order === 'desc' ? -cmp : cmp;
  });

  const total = list.length;
  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(100, Math.max(1, filter.pageSize || 20));
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return { items, total };
}

/** 会话详情：与 SessionDetail 对齐 */
export function getSessionDetail(id) {
  const { sessions, messagesBySession } = read();
  const session = sessions.find((s) => s.id === id);
  if (!session) return null;
  const messages = messagesBySession[id] || [];
  return {
    session: {
      id: session.id,
      userId: session.userId ?? 0,
      userName: session.userName ?? 'Demo用户',
      title: session.title,
      createdAt: session.createdAt,
      totalTokens: session.totalTokens ?? 0,
      totalCost: session.totalCost ?? 0,
    },
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      msgType: m.msgType || 'text',
      cardData: m.cardData ?? null,
      createdAt: m.createdAt,
      debug: m.debug ?? undefined,
      feedback: m.feedback ?? undefined,
    })),
  };
}

/**
 * 入库：前端上报的会话（全量覆盖该会话的消息）
 * body: {
 *   sessionId, title, userId?, userName?,
 *   totalTokens?, totalCost?, rating?, skill?, projectId?,
 *   messages: [{ id, role, content, cardData?, createdAt?, debug?, feedback? }]
 * }
 */
export function ingestSession(payload) {
  const {
    sessionId,
    title,
    userId = 0,
    userName = 'Demo用户',
    totalTokens,
    totalCost,
    rating,
    skill,
    projectId,
    messages = [],
  } = payload;
  if (!sessionId || !Array.isArray(messages)) {
    throw new Error('sessionId and messages required');
  }

  const data = read();
  const now = new Date().toISOString();

  const existing = data.sessions.find((s) => s.id === sessionId);
  const messageCount = messages.length;

  if (!existing) {
    data.sessions.push({
      id: sessionId,
      userId,
      userName,
      title: title || '新对话',
      messageCount,
      totalTokens: totalTokens ?? 0,
      totalCost: totalCost ?? 0,
      rating: rating ?? null,
      skill: skill ?? null,
      projectId: projectId ?? null,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    existing.updatedAt = now;
    if (title !== undefined) existing.title = title || existing.title;
    existing.messageCount = messageCount;
    if (totalTokens !== undefined) existing.totalTokens = totalTokens;
    if (totalCost !== undefined) existing.totalCost = totalCost;
    if (rating !== undefined) existing.rating = rating;
    if (skill !== undefined) existing.skill = skill;
    if (projectId !== undefined) existing.projectId = projectId;
  }

  data.messagesBySession[sessionId] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content || '',
    msgType: (m.cardData && m.cardData.type) || 'text',
    cardData: m.cardData ?? null,
    createdAt: m.createdAt || now,
    debug: m.debug ?? null,
    feedback: m.feedback ?? null,
  }));

  write(data);
  return { ok: true, sessionId };
}

/**
 * 更新会话元数据（事后补充或主后端回调）
 * body: { totalTokens?, totalCost?, rating?, skill?, projectId?, title? }
 */
export function updateSessionMeta(id, payload) {
  const data = read();
  const session = data.sessions.find((s) => s.id === id);
  if (!session) return null;
  const now = new Date().toISOString();
  if (payload.totalTokens !== undefined) session.totalTokens = payload.totalTokens;
  if (payload.totalCost !== undefined) session.totalCost = payload.totalCost;
  if (payload.rating !== undefined) session.rating = payload.rating;
  if (payload.skill !== undefined) session.skill = payload.skill;
  if (payload.projectId !== undefined) session.projectId = payload.projectId;
  if (payload.title !== undefined) session.title = payload.title;
  session.updatedAt = now;
  write(data);
  return session;
}
