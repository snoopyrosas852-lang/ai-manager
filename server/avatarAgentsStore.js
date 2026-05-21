/**
 * 小仙分身 — 固定智能体配置（管理后台 CRUD + 前台公开列表）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'avatar-agents.json');

/** @typedef {'work'|'study'|'creation'|'life'} AvatarCategory */
/** @typedef {'chat'|'external_link'|'spa_path'} RouteKind */
/** @typedef {'public'|'login_only'} Visibility */

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const DEFAULT_AGENTS = [
  {
    id: 'ava-writing',
    name: '全能写作助手',
    description: '提供多种文案创作选择，覆盖公文、营销与总结纪要。',
    systemPrompt:
      '你是一位资深内容写作顾问，擅长结构清晰、语气得体的中文商务与办公文案。回答简洁有条理，必要时给出可直接使用的段落。',
    category: 'work',
    avatarEmoji: '✏️',
    visibility: 'public',
    routeKind: 'chat',
    routePayload: '',
    statsLabel: '多人使用过',
    authorLabel: '@咸亨小仙官方',
    enabled: true,
    sortOrder: 10,
  },
  {
    id: 'ava-python',
    name: 'Python 编程助手',
    description: '解释语法、调试思路与脚本示例，适合日常开发与自动化。',
    systemPrompt:
      '你是一位耐心的 Python 导师，优先给出可运行示例与注意事项，避免空洞术语堆砌。',
    category: 'study',
    avatarEmoji: '🐍',
    visibility: 'public',
    routeKind: 'chat',
    routePayload: '',
    statsLabel: '热门分身',
    authorLabel: '@咸亨小仙官方',
    enabled: true,
    sortOrder: 20,
  },
  {
    id: 'ava-procurement',
    name: '采购询价分身',
    description: '围绕 MRO / 工业品询价话术与表格字段给出建议。',
    systemPrompt:
      '你熟悉企业采购与 MRO 场景，帮助用户整理询价维度、规格字段与比价要点。',
    category: 'work',
    avatarEmoji: '📋',
    visibility: 'public',
    routeKind: 'chat',
    routePayload: '',
    statsLabel: '业务常用',
    authorLabel: '@咸亨小仙官方',
    enabled: true,
    sortOrder: 30,
  },
];

function ensureDir() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readRaw() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) {
    return { agents: clone(DEFAULT_AGENTS), updatedAt: new Date().toISOString() };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.agents)) {
      return { agents: clone(DEFAULT_AGENTS), updatedAt: new Date().toISOString() };
    }
    return raw;
  } catch {
    return { agents: clone(DEFAULT_AGENTS), updatedAt: new Date().toISOString() };
  }
}

function writeRaw(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeAgent(row) {
  const id = String(row?.id || '').trim().slice(0, 64);
  const name = String(row?.name ?? '').trim().slice(0, 128);
  const description = String(row?.description ?? '').trim().slice(0, 500);
  const systemPrompt = String(row?.systemPrompt ?? '').trim().slice(0, 8000);
  const cat = String(row?.category || 'work').toLowerCase();
  const category = ['work', 'study', 'creation', 'life'].includes(cat) ? cat : 'work';
  const avatarEmoji = String(row?.avatarEmoji || '🤖').trim().slice(0, 16);
  const avatarImageUrl = String(row?.avatarImageUrl ?? '')
    .trim()
    .slice(0, 500000);
  const vis = String(row?.visibility || 'public').toLowerCase();
  const visibility = vis === 'login_only' ? 'login_only' : 'public';
  const rk = String(row?.routeKind || 'chat').toLowerCase();
  const routeKind = ['chat', 'external_link', 'spa_path'].includes(rk) ? rk : 'chat';
  const routePayload = String(row?.routePayload ?? '').trim().slice(0, 2048);
  const statsLabel = String(row?.statsLabel ?? '').trim().slice(0, 128);
  const authorLabel = String(row?.authorLabel ?? '').trim().slice(0, 128);
  const enabled = row?.enabled !== false;
  const sortOrder =
    typeof row?.sortOrder === 'number' && Number.isFinite(row.sortOrder) ? Math.round(row.sortOrder) : 100;

  const pbs = String(row?.pageBgStyle || 'default').toLowerCase();
  const pageBgStyle = ['default', 'solid', 'gradient', 'image'].includes(pbs) ? pbs : 'default';
  const pageBgColor = String(row?.pageBgColor ?? '')
    .trim()
    .slice(0, 32);
  const pageBgGradientStart = String(row?.pageBgGradientStart ?? '')
    .trim()
    .slice(0, 32);
  const pageBgGradientEnd = String(row?.pageBgGradientEnd ?? '')
    .trim()
    .slice(0, 32);
  const pageBgImageUrl = String(row?.pageBgImageUrl ?? '')
    .trim()
    .slice(0, 500000);

  return {
    id: id || `ava-${Date.now()}`,
    name,
    description,
    systemPrompt,
    category,
    avatarEmoji,
    avatarImageUrl: avatarImageUrl || undefined,
    visibility,
    routeKind,
    routePayload,
    statsLabel,
    authorLabel,
    enabled,
    sortOrder,
    pageBgStyle,
    pageBgColor: pageBgColor || undefined,
    pageBgGradientStart: pageBgGradientStart || undefined,
    pageBgGradientEnd: pageBgGradientEnd || undefined,
    pageBgImageUrl: pageBgImageUrl || undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function listAvatarAgentsAdmin() {
  const raw = readRaw();
  const agents = Array.isArray(raw.agents) ? raw.agents.map((a) => normalizeAgent({ ...a })) : [];
  agents.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  return { agents, updatedAt: raw.updatedAt || new Date().toISOString() };
}

/** 前台卡片列表（不含 systemPrompt） */
export function listAvatarAgentsPublic() {
  const { agents } = listAvatarAgentsAdmin();
  return agents.filter((a) => a.enabled).map((a) => {
    const { systemPrompt: _omit, ...pub } = a;
    void _omit;
    return pub;
  });
}

/** 前台激活对话用（含 systemPrompt） */
export function getAvatarAgentPublicById(id) {
  const sid = String(id || '').trim();
  if (!sid) return null;
  const { agents } = listAvatarAgentsAdmin();
  const a = agents.find((x) => x.id === sid && x.enabled);
  return a ? normalizeAgent(a) : null;
}

export function upsertAvatarAgent(body) {
  const raw = readRaw();
  const agents = Array.isArray(raw.agents) ? [...raw.agents] : [];
  const existingId = String(body?.id || '').trim();
  const prev = existingId ? agents.find((x) => String(x.id) === existingId) : null;
  const merged = {
    ...(prev || {}),
    ...body,
    id: existingId || `ava-${Date.now()}`,
  };
  const row = normalizeAgent(merged);
  if (!row.name.trim()) {
    const err = new Error('名称不能为空');
    err.code = 'VALIDATION';
    throw err;
  }
  const idx = agents.findIndex((x) => String(x.id) === row.id);
  if (idx >= 0) agents[idx] = row;
  else agents.push(row);
  raw.agents = agents;
  raw.updatedAt = new Date().toISOString();
  writeRaw(raw);
  return listAvatarAgentsAdmin();
}

export function deleteAvatarAgent(id) {
  const sid = String(id || '').trim();
  if (!sid) {
    const err = new Error('缺少 id');
    err.code = 'VALIDATION';
    throw err;
  }
  const raw = readRaw();
  const agents = (Array.isArray(raw.agents) ? raw.agents : []).filter((x) => String(x.id) !== sid);
  raw.agents = agents;
  raw.updatedAt = new Date().toISOString();
  writeRaw(raw);
  return listAvatarAgentsAdmin();
}
