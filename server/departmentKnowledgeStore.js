/**
 * 部门知识库 — JSON 元数据 + 本地文件二进制
 * 数据：./data/departmentKnowledge.json
 * 文件：./data/knowledge-blobs/{nodeId}
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'departmentKnowledge.json');
const BLOB_DIR = path.join(DATA_DIR, 'knowledge-blobs');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BLOB_DIR)) fs.mkdirSync(BLOB_DIR, { recursive: true });
}

function defaultDb() {
  const now = new Date().toISOString();
  return {
    departments: [
      { id: 'dept-sales', name: '销售部', sort: 0, enabled: true },
      { id: 'dept-fin', name: '财务部', sort: 1, enabled: true },
    ],
    nodes: [
      {
        id: 'kb-root-1',
        parentId: null,
        type: 'folder',
        name: '共享资料',
        size: null,
        mime: null,
        storageKey: null,
        ownerUserId: 'system',
        ownerUserLabel: '系统',
        ownerDeptId: 'dept-sales',
        createdAt: now,
        updatedAt: now,
        sort: 0,
        deleted: false,
        excludeFromKb: false,
      },
    ],
    acls: [
      {
        id: 'acl-1',
        nodeId: 'kb-root-1',
        subjectType: 'dept',
        subjectId: 'dept-sales',
        permission: 'write',
        inherit: true,
      },
      {
        id: 'acl-2',
        nodeId: 'kb-root-1',
        subjectType: 'dept',
        subjectId: 'dept-fin',
        permission: 'read',
        inherit: true,
      },
    ],
    audit: [],
  };
}

function readDb() {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const d = defaultDb();
    writeDb(d);
    return d;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const d = JSON.parse(raw);
    if (!d.departments) d.departments = [];
    if (!d.nodes) d.nodes = [];
    if (!d.acls) d.acls = [];
    if (!d.audit) d.audit = [];
    for (const n of d.nodes) {
      if (n.type === 'folder' && n.excludeFromKb === undefined) n.excludeFromKb = false;
    }
    return d;
  } catch {
    const d = defaultDb();
    writeDb(d);
    return d;
  }
}

function writeDb(data) {
  ensureDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function appendAudit(db, entry) {
  db.audit.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...entry,
  });
  if (db.audit.length > 500) db.audit = db.audit.slice(-500);
}

const rank = { none: 0, read: 1, write: 2 };

function maxPerm(a, b) {
  return rank[a] >= rank[b] ? a : b;
}

export function nodeById(db, id) {
  return db.nodes.find((n) => n.id === id && !n.deleted);
}

function aclsOnFolder(db, folderId, deptId) {
  return db.acls.filter(
    (a) => a.nodeId === folderId && a.subjectType === 'dept' && a.subjectId === deptId,
  );
}

/** 自祖先链路上仅统计 inherit===true 的 ACL */
function inheritedFromAncestors(db, folderId, deptId) {
  const folder = nodeById(db, folderId);
  if (!folder || !folder.parentId) return 'none';
  let cur = folder.parentId;
  let best = 'none';
  while (cur) {
    const acls = db.acls.filter(
      (a) =>
        a.nodeId === cur &&
        a.subjectType === 'dept' &&
        a.subjectId === deptId &&
        a.inherit === true,
    );
    for (const a of acls) best = maxPerm(best, a.permission);
    const pn = nodeById(db, cur);
    cur = pn ? pn.parentId : null;
  }
  return best;
}

/** 浏览文件夹节点本身（列入父目录、进入该文件夹） */
export function folderBrowsePermission(db, folderId, deptId) {
  if (!folderId) return 'none';
  let best = inheritedFromAncestors(db, folderId, deptId);
  for (const a of aclsOnFolder(db, folderId, deptId)) {
    best = maxPerm(best, a.permission);
  }
  return best;
}

/** 读取文件夹下的文件：仅继承型 ACL 自父文件夹向下生效 + 父文件夹上 inherit=true 的条目 */
function fileReadPermission(db, fileNode, deptId) {
  const P = fileNode.parentId;
  if (!P) return 'none';
  let best = inheritedFromAncestors(db, P, deptId);
  for (const a of aclsOnFolder(db, P, deptId)) {
    if (a.inherit) best = maxPerm(best, a.permission);
  }
  return best;
}

/** 用户对节点是否可见（列表/下载） */
export function userCanSeeNode(db, node, deptIds) {
  if (!deptIds?.length) return false;
  for (const d of deptIds) {
    if (node.type === 'folder') {
      if (folderBrowsePermission(db, node.id, d) !== 'none') return true;
    } else if (fileReadPermission(db, node, d) !== 'none') return true;
  }
  return false;
}

/** 用户对节点最高权限（用于展示/简化校验） */
export function effectivePermissionForUser(db, nodeId, deptIds) {
  const n = nodeById(db, nodeId);
  if (!n || !deptIds?.length) return 'none';
  let best = 'none';
  for (const d of deptIds) {
    const p =
      n.type === 'folder' ? folderBrowsePermission(db, n.id, d) : fileReadPermission(db, n, d);
    best = maxPerm(best, p);
  }
  return best;
}

export function listDepartments(db = readDb()) {
  return [...db.departments].filter((d) => d.enabled !== false).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function listAllDepartmentsAdmin(db = readDb()) {
  return [...db.departments].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

export function upsertDepartment(db, row) {
  const i = db.departments.findIndex((d) => d.id === row.id);
  if (i >= 0) db.departments[i] = { ...db.departments[i], ...row };
  else db.departments.push({ enabled: true, sort: 0, ...row });
  writeDb(db);
}

export function deleteDepartment(db, id) {
  db.departments = db.departments.filter((d) => d.id !== id);
  writeDb(db);
}

export function listAclsForNode(db, nodeId) {
  return db.acls.filter((a) => a.nodeId === nodeId);
}

export function setAclsForNode(db, nodeId, acls, actor) {
  db.acls = db.acls.filter((a) => a.nodeId !== nodeId);
  for (const a of acls) {
    db.acls.push({
      id: crypto.randomUUID(),
      nodeId,
      subjectType: a.subjectType || 'dept',
      subjectId: a.subjectId,
      permission: a.permission === 'write' ? 'write' : 'read',
      inherit: a.inherit !== false,
    });
  }
  appendAudit(db, { action: 'acl_set', nodeId, actor, count: acls.length });
  writeDb(db);
}

export function listChildrenAdmin(db, parentId) {
  return db.nodes
    .filter((n) => !n.deleted && (parentId == null ? n.parentId === null : n.parentId === parentId))
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
}

export function listChildrenForUser(db, parentId, deptIds) {
  const all = listChildrenAdmin(db, parentId);
  return all.filter((n) => userCanSeeNode(db, n, deptIds));
}

export function canReadNode(db, nodeId, deptIds) {
  const n = nodeById(db, nodeId);
  if (!n) return false;
  return userCanSeeNode(db, n, deptIds);
}

export function canWriteInFolder(db, folderId, deptIds) {
  if (!folderId || !deptIds?.length) return false;
  for (const d of deptIds) {
    if (folderBrowsePermission(db, folderId, d) === 'write') return true;
  }
  return false;
}

export function totalUsedBytes(db) {
  return db.nodes.filter((n) => n.type === 'file' && !n.deleted).reduce((s, n) => s + (n.size || 0), 0);
}

export function createFolder(db, { parentId, name, ownerDeptId, ownerUserLabel }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const siblings = listChildrenAdmin(db, parentId);
  const sort = siblings.length;
  db.nodes.push({
    id,
    parentId,
    type: 'folder',
    name: name || '新建文件夹',
    size: null,
    mime: null,
    storageKey: null,
    ownerUserId: null,
    ownerUserLabel: ownerUserLabel || '—',
    ownerDeptId: ownerDeptId || null,
    createdAt: now,
    updatedAt: now,
    sort,
    deleted: false,
    excludeFromKb: false,
  });
  appendAudit(db, { action: 'folder_create', nodeId: id, parentId });
  writeDb(db);
  return id;
}

export function createFileRecord(db, { parentId, name, mime, size, ownerDeptId, ownerUserLabel }) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const siblings = listChildrenAdmin(db, parentId);
  db.nodes.push({
    id,
    parentId,
    type: 'file',
    name,
    size,
    mime: mime || 'application/octet-stream',
    storageKey: `knowledge-blobs/${id}`,
    ownerUserId: null,
    ownerUserLabel: ownerUserLabel || '—',
    ownerDeptId: ownerDeptId || null,
    createdAt: now,
    updatedAt: now,
    sort: siblings.length,
    deleted: false,
  });
  appendAudit(db, { action: 'file_create', nodeId: id, parentId, size });
  writeDb(db);
  return id;
}

export function writeBlob(nodeId, buffer) {
  ensureDirs();
  const p = path.join(BLOB_DIR, nodeId);
  fs.writeFileSync(p, buffer);
}

export function readBlob(nodeId) {
  const p = path.join(BLOB_DIR, nodeId);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p);
}

export function renameNode(db, id, name) {
  const n = nodeById(db, id);
  if (!n) return false;
  n.name = name;
  n.updatedAt = new Date().toISOString();
  appendAudit(db, { action: 'rename', nodeId: id });
  writeDb(db);
  return true;
}

export function moveNode(db, id, newParentId) {
  const n = nodeById(db, id);
  if (!n) return { ok: false, error: 'not_found' };
  if (newParentId === id) return { ok: false, error: 'invalid' };
  if (newParentId) {
    const p = nodeById(db, newParentId);
    if (!p || p.type !== 'folder') return { ok: false, error: 'bad_parent' };
    let c = newParentId;
    while (c) {
      if (c === id) return { ok: false, error: 'cycle' };
      const x = nodeById(db, c);
      c = x ? x.parentId : null;
    }
  }
  n.parentId = newParentId;
  n.updatedAt = new Date().toISOString();
  appendAudit(db, { action: 'move', nodeId: id, newParentId });
  writeDb(db);
  return { ok: true };
}

export function softDeleteNode(db, id) {
  const n = nodeById(db, id);
  if (!n) return false;
  n.deleted = true;
  n.updatedAt = new Date().toISOString();
  appendAudit(db, { action: 'delete', nodeId: id });
  writeDb(db);
  return true;
}

export function searchNodesAdmin(db, keyword) {
  const k = (keyword || '').toLowerCase();
  if (!k) return [];
  return db.nodes.filter((n) => !n.deleted && n.name.toLowerCase().includes(k));
}

/** 自该节点沿父链向上，是否存在「不参与知识库/问答」的文件夹（V1.0.2 黑名单） */
export function isPathExcludedFromKb(db, nodeId) {
  let cur = nodeById(db, nodeId);
  while (cur) {
    if (cur.type === 'folder' && cur.excludeFromKb) return true;
    cur = cur.parentId ? nodeById(db, cur.parentId) : null;
  }
  return false;
}

export { readDb, writeDb };
