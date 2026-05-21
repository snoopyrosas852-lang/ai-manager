/**
 * 导航角色：控制小仙前台左侧栏可见模块（与 assistant Sidebar 对齐）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'nav-roles.json');

/** 默认模块清单（首次写入文件或与旧数据合并时用） */
export const NAV_MODULE_CATALOG_DEFAULT = [
  { id: 'xiaoxian', label: '小仙', path: '/', description: 'AI 对话主页' },
  { id: 'toolbox', label: '小仙百宝箱', path: '/workbench/toolbox', description: '文档与工具箱' },
  { id: 'tasks', label: '任务中心', path: '/workbench/tasks', description: '异步任务与下载' },
  {
    id: 'tender-materials',
    label: '招标资料',
    path: '/workbench/tender-materials',
    description: '招标资料整理',
  },
  {
    id: 'dept-knowledge',
    label: '部门知识库',
    path: '/workbench/dept-knowledge',
    description: '部门资料与知识文档',
  },
  {
    id: 'xiaoxian-avatar',
    label: '小仙分身',
    path: '/workbench/xiaoxian-avatar',
    description: '发现固定智能体分身并发起对话',
  },
];

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function normalizeCatalog(incoming) {
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return clone(NAV_MODULE_CATALOG_DEFAULT);
  }
  const out = [];
  const seen = new Set();
  for (const item of incoming) {
    const id = String(item?.id || '')
      .trim()
      .slice(0, 64);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const label = String(item?.label || id).slice(0, 128);
    const pathStr = String(item?.path ?? '/').slice(0, 256);
    const row = {
      id,
      label,
      path: pathStr || '/',
    };
    if (item?.description != null && String(item.description).trim()) {
      row.description = String(item.description).slice(0, 500);
    }
    out.push(row);
  }
  const seenFinal = new Set(out.map((m) => m.id));
  for (const def of NAV_MODULE_CATALOG_DEFAULT) {
    if (!seenFinal.has(def.id)) {
      seenFinal.add(def.id);
      out.push(clone(def));
    }
  }
  return out.length ? out : clone(NAV_MODULE_CATALOG_DEFAULT);
}

const DEFAULT_STATE = {
  catalog: clone(NAV_MODULE_CATALOG_DEFAULT),
  defaultRoleId: 'role-chat-toolbox',
  roles: [
    {
      id: 'role-all',
      name: '超级管理员',
      description: '默认可见全部导航模块',
      navModuleIds: NAV_MODULE_CATALOG_DEFAULT.map((m) => m.id),
    },
    {
      id: 'role-chat-toolbox',
      name: '普通用户',
      description: '运营常用：对话 + 百宝箱',
      navModuleIds: ['xiaoxian', 'toolbox', 'tasks', 'tender-materials', 'dept-knowledge', 'xiaoxian-avatar'],
    },
  ],
};

function ensureDir() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readState() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) {
    return clone(DEFAULT_STATE);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    return typeof raw === 'object' && raw !== null ? raw : clone(DEFAULT_STATE);
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function writeState(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizeModuleIds(ids, catalogIdSet) {
  if (!Array.isArray(ids)) return [];
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const s = String(id || '').trim();
    if (!catalogIdSet.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function getNavRolesPayload() {
  const raw = readState();
  const catalog = normalizeCatalog(raw.catalog);
  const catalogIdSet = new Set(catalog.map((m) => m.id));

  const rolesIn = Array.isArray(raw.roles) ? raw.roles : DEFAULT_STATE.roles;
  let defaultRoleId =
    typeof raw.defaultRoleId === 'string' && raw.defaultRoleId.trim()
      ? raw.defaultRoleId.trim()
      : DEFAULT_STATE.defaultRoleId;

  const normalized = rolesIn.map((r, i) => {
    let navModuleIds = sanitizeModuleIds(r.navModuleIds, catalogIdSet);
    const fallbackId = catalog[0]?.id ?? 'xiaoxian';
    if (navModuleIds.length === 0) navModuleIds = fallbackId ? [fallbackId] : [];
    return {
      id: typeof r.id === 'string' && r.id.trim() ? r.id.trim() : `role-${i}`,
      name: String(r.name || `角色 ${i + 1}`).slice(0, 64),
      description: String(r.description || '').slice(0, 500),
      navModuleIds,
    };
  });

  if (!normalized.some((r) => r.id === defaultRoleId)) {
    defaultRoleId = normalized[0]?.id ?? DEFAULT_STATE.defaultRoleId;
  }

  return {
    catalog,
    defaultRoleId,
    roles: normalized,
  };
}

export function setNavRolesPayload(body) {
  if (!body || typeof body !== 'object') {
    const err = new Error('Invalid payload');
    err.code = 'VALIDATION';
    throw err;
  }

  const catalog = normalizeCatalog(body.catalog);

  const catalogIdSet = new Set(catalog.map((m) => m.id));
  if (catalogIdSet.size === 0) {
    const err = new Error('模块字典至少保留一项');
    err.code = 'VALIDATION';
    throw err;
  }

  const rolesIn = Array.isArray(body.roles) ? body.roles : null;
  if (!rolesIn || rolesIn.length === 0) {
    const err = new Error('至少保留一个角色');
    err.code = 'VALIDATION';
    throw err;
  }

  const roles = rolesIn.map((r, i) => {
    let navModuleIds = sanitizeModuleIds(r.navModuleIds, catalogIdSet);
    if (navModuleIds.length === 0) {
      const err = new Error('每个角色至少勾选一个导航模块');
      err.code = 'VALIDATION';
      throw err;
    }
    return {
      id: typeof r.id === 'string' && r.id.trim() ? r.id.trim().slice(0, 64) : `role-${Date.now()}-${i}`,
      name: String(r.name || `角色 ${i + 1}`).slice(0, 64),
      description: String(r.description || '').slice(0, 500),
      navModuleIds,
    };
  });

  const ids = new Set();
  for (const r of roles) {
    if (ids.has(r.id)) {
      const err = new Error(`角色 ID 重复：${r.id}`);
      err.code = 'VALIDATION';
      throw err;
    }
    ids.add(r.id);
  }

  let defaultRoleId =
    typeof body.defaultRoleId === 'string' && body.defaultRoleId.trim()
      ? body.defaultRoleId.trim()
      : roles[0].id;
  if (!ids.has(defaultRoleId)) defaultRoleId = roles[0].id;

  const next = { catalog, defaultRoleId, roles };
  writeState(next);
  return getNavRolesPayload();
}

/** 解析某角色可见的导航项（供公开接口） */
export function resolveSidebarItems(roleId) {
  const { catalog, defaultRoleId, roles } = getNavRolesPayload();
  const rid = typeof roleId === 'string' && roleId.trim() ? roleId.trim() : defaultRoleId;
  const role = roles.find((r) => r.id === rid) ?? roles.find((r) => r.id === defaultRoleId) ?? roles[0];
  const allowed = new Set(role?.navModuleIds ?? []);
  const items = catalog
    .filter((m) => allowed.has(m.id))
    .map((m) => ({
      id: m.id,
      label: m.label,
      path: m.path,
    }));
  return {
    roleId: role?.id ?? defaultRoleId,
    roleName: role?.name ?? '',
    items,
  };
}

/** 调试令牌展示全模块；user/demo-user 优先匹配 id=user 的角色，否则走默认角色 */
export function resolveSidebarForHttpRequest(req) {
  const auth = req.headers?.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const t = token.toLowerCase();

  if (t === 'dev' || t === 'test') {
    const { catalog } = getNavRolesPayload();
    const items = catalog.map((m) => ({ id: m.id, label: m.label, path: m.path }));
    return { roleId: 'dev', roleName: '调试（全模块）', items };
  }

  if (t === 'user' || t === 'demo-user') {
    const { roles, defaultRoleId } = getNavRolesPayload();
    const userRole = roles.find((r) => r.id === 'user');
    if (userRole) return resolveSidebarItems('user');
    return resolveSidebarItems(defaultRoleId);
  }

  if (token) {
    const { defaultRoleId } = getNavRolesPayload();
    return resolveSidebarItems(defaultRoleId);
  }

  const q = typeof req.query?.roleId === 'string' ? req.query.roleId.trim() : '';
  return resolveSidebarItems(q || undefined);
}
