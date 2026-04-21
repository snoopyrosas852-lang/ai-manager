/**
 * 部门知识库 HTTP 路由
 * - /api/admin/kb/* 管理端（与现有 admin 路由一致，依赖前端登录态 Bearer）
 * - /api/kb/me/* 小仙前台：通过 X-Dept-Ids / X-User-Name 传递上下文（内网 demo；生产应由网关注入）
 */

import {
  readDb,
  writeDb,
  listAllDepartmentsAdmin,
  upsertDepartment,
  deleteDepartment,
  listChildrenAdmin,
  listChildrenForUser,
  listAclsForNode,
  setAclsForNode,
  createFolder,
  createFileRecord,
  writeBlob,
  readBlob,
  renameNode,
  moveNode,
  softDeleteNode,
  searchNodesAdmin,
  canReadNode,
  canWriteInFolder,
  totalUsedBytes,
  nodeById,
  userCanSeeNode,
  isPathExcludedFromKb,
} from './departmentKnowledgeStore.js';
import {
  readManagedDb,
  listManagedForDepts,
  listManagedAll,
  addManagedFile,
  retryManagedVector,
  updateManagedSettings,
} from './managedCorpusStore.js';

const KB_MAX_BYTES = Number(process.env.KB_MAX_UPLOAD_BYTES || 20 * 1024 * 1024);
const KB_QUOTA_BYTES = Number(process.env.KB_QUOTA_BYTES || 512 * 1024 * 1024);

function parseDeptIds(req) {
  const h = req.headers['x-dept-ids'];
  if (h) return String(h).split(',').map((s) => s.trim()).filter(Boolean);
  if (req.query.deptIds) return String(req.query.deptIds).split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function parseUserLabel(req) {
  const n = req.headers['x-user-name'];
  if (n) return decodeURIComponent(String(n));
  return req.headers['x-user-label'] ? String(req.headers['x-user-label']) : '用户';
}

export function registerKnowledgeBaseRoutes(app) {
  // ---------- 部门字典 ----------
  app.get('/api/admin/kb/departments', (req, res) => {
    try {
      res.json({ items: listAllDepartmentsAdmin() });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/kb/departments', (req, res) => {
    try {
      const db = readDb();
      const { id, name, sort, enabled } = req.body || {};
      if (!id || !name) return res.status(400).json({ error: 'id 与 name 必填' });
      upsertDepartment(db, { id, name, sort: sort ?? 0, enabled: enabled !== false });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/kb/departments/:id', (req, res) => {
    try {
      const db = readDb();
      const row = db.departments.find((d) => d.id === req.params.id);
      if (!row) return res.status(404).json({ error: 'not_found' });
      Object.assign(row, req.body || {});
      writeDb(db);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/kb/departments/:id', (req, res) => {
    try {
      const db = readDb();
      deleteDepartment(db, req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- 节点（管理端全量） ----------
  app.get('/api/admin/kb/nodes', (req, res) => {
    try {
      const db = readDb();
      const parentId = req.query.parentId === 'null' || req.query.parentId === '' ? null : req.query.parentId;
      const flat = req.query.flat === '1';
      if (flat) {
        res.json({ items: db.nodes.filter((n) => !n.deleted) });
        return;
      }
      res.json({ items: listChildrenAdmin(db, parentId ?? null) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/kb/search', (req, res) => {
    try {
      const db = readDb();
      const items = searchNodesAdmin(db, req.query.q || '');
      res.json({ items });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/kb/nodes', (req, res) => {
    try {
      const db = readDb();
      const { parentId, name, ownerDeptId } = req.body || {};
      const pid = parentId === undefined || parentId === 'null' ? null : parentId;
      const id = createFolder(db, {
        parentId: pid,
        name,
        ownerDeptId: ownerDeptId || null,
        ownerUserLabel: '管理员',
      });
      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/admin/kb/nodes/:id', (req, res) => {
    try {
      const db = readDb();
      const { name, parentId, excludeFromKb } = req.body || {};
      if (name != null) renameNode(db, req.params.id, name);
      if (parentId !== undefined) {
        const r = moveNode(db, req.params.id, parentId === 'null' ? null : parentId);
        if (!r.ok) return res.status(400).json({ error: r.error });
      }
      if (excludeFromKb !== undefined) {
        const n = nodeById(db, req.params.id);
        if (!n || n.type !== 'folder') {
          return res.status(400).json({ error: 'excludeFromKb 仅适用于文件夹' });
        }
        n.excludeFromKb = !!excludeFromKb;
        n.updatedAt = new Date().toISOString();
        writeDb(db);
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/kb/nodes/:id', (req, res) => {
    try {
      const db = readDb();
      softDeleteNode(db, req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/kb/files', (req, res) => {
    try {
      const db = readDb();
      const { parentId, name, mime, base64 } = req.body || {};
      if (!parentId || !name || !base64) {
        return res.status(400).json({ error: 'parentId, name, base64 必填' });
      }
      const buf = Buffer.from(base64, 'base64');
      if (buf.length > KB_MAX_BYTES) {
        return res.status(413).json({ error: `单文件超过上限 ${KB_MAX_BYTES} 字节` });
      }
      if (totalUsedBytes(db) + buf.length > KB_QUOTA_BYTES) {
        return res.status(413).json({ error: '超过知识库存储配额' });
      }
      const folder = nodeById(db, parentId);
      if (!folder || folder.type !== 'folder') return res.status(400).json({ error: 'parent_not_folder' });
      const id = createFileRecord(db, {
        parentId,
        name,
        mime,
        size: buf.length,
        ownerDeptId: folder.ownerDeptId,
        ownerUserLabel: '管理员',
      });
      writeBlob(id, buf);
      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/kb/nodes/:id/acls', (req, res) => {
    try {
      const db = readDb();
      res.json({ items: listAclsForNode(db, req.params.id) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/kb/nodes/:id/acls', (req, res) => {
    try {
      const db = readDb();
      const { acls } = req.body || {};
      if (!Array.isArray(acls)) return res.status(400).json({ error: 'acls 须为数组' });
      setAclsForNode(db, req.params.id, acls, 'admin');
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/kb/stats', (req, res) => {
    try {
      const db = readDb();
      res.json({ usedBytes: totalUsedBytes(db), quotaBytes: KB_QUOTA_BYTES });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ---------- 小仙前台（按部门过滤） ----------
  app.get('/api/kb/me/stats', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      const db = readDb();
      let used = 0;
      for (const n of db.nodes) {
        if (n.deleted || n.type !== 'file') continue;
        if (canReadNode(db, n.id, deptIds)) used += n.size || 0;
      }
      res.json({ usedBytes: used, quotaBytes: KB_QUOTA_BYTES, deptIds });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/kb/me/nodes', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) {
        return res.status(403).json({ error: 'no_dept', message: '缺少部门上下文（X-Dept-Ids）' });
      }
      const db = readDb();
      const parentId =
        req.query.parentId === undefined || req.query.parentId === '' || req.query.parentId === 'null'
          ? null
          : req.query.parentId;
      const items = listChildrenForUser(db, parentId, deptIds);
      res.json({
        items: items.map((n) => ({
          id: n.id,
          parentId: n.parentId,
          type: n.type,
          name: n.name,
          size: n.size,
          mime: n.mime,
          ownerUserLabel: n.ownerUserLabel,
          ownerDeptId: n.ownerDeptId,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          canWrite: n.type === 'folder' ? canWriteInFolder(db, n.id, deptIds) : false,
          excludeFromKb: n.type === 'folder' ? !!n.excludeFromKb : undefined,
        })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/kb/me/nodes', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) return res.status(403).json({ error: 'no_dept' });
      const db = readDb();
      const { parentId, name } = req.body || {};
      const pid = parentId === undefined || parentId === 'null' ? null : parentId;
      if (!pid || !canWriteInFolder(db, pid, deptIds)) {
        return res.status(403).json({ error: 'no_write' });
      }
      const primary = deptIds[0];
      const id = createFolder(db, {
        parentId: pid,
        name,
        ownerDeptId: primary,
        ownerUserLabel: parseUserLabel(req),
      });
      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/kb/me/files', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) return res.status(403).json({ error: 'no_dept' });
      const db = readDb();
      const { parentId, name, mime, base64 } = req.body || {};
      if (!parentId || !name || !base64) return res.status(400).json({ error: 'bad_body' });
      if (!canWriteInFolder(db, parentId, deptIds)) return res.status(403).json({ error: 'no_write' });
      const buf = Buffer.from(base64, 'base64');
      if (buf.length > KB_MAX_BYTES) return res.status(413).json({ error: 'too_large' });
      if (totalUsedBytes(db) + buf.length > KB_QUOTA_BYTES) return res.status(413).json({ error: 'quota' });
      const folder = nodeById(db, parentId);
      const id = createFileRecord(db, {
        parentId,
        name,
        mime,
        size: buf.length,
        ownerDeptId: folder?.ownerDeptId || deptIds[0],
        ownerUserLabel: parseUserLabel(req),
      });
      writeBlob(id, buf);
      res.json({ id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/kb/me/nodes/:id', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      const db = readDb();
      const n = nodeById(db, req.params.id);
      if (!n || !userCanSeeNode(db, n, deptIds)) return res.status(404).json({ error: 'not_found' });
      const parent = n.parentId ? nodeById(db, n.parentId) : null;
      if (!parent || !canWriteInFolder(db, parent.id, deptIds)) return res.status(403).json({ error: 'no_write' });
      const { name } = req.body || {};
      if (name != null) renameNode(db, req.params.id, name);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/kb/me/nodes/:id', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      const db = readDb();
      const n = nodeById(db, req.params.id);
      if (!n || !userCanSeeNode(db, n, deptIds)) return res.status(404).json({ error: 'not_found' });
      if (!n.parentId) return res.status(403).json({ error: 'no_delete_root' });
      if (!canWriteInFolder(db, n.parentId, deptIds)) return res.status(403).json({ error: 'no_write' });
      softDeleteNode(db, req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/kb/me/download/:id', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      const db = readDb();
      const n = nodeById(db, req.params.id);
      if (!n || n.type !== 'file' || !canReadNode(db, n.id, deptIds)) {
        return res.status(404).end();
      }
      const buf = readBlob(n.id);
      if (!buf) return res.status(404).end();
      res.setHeader('Content-Type', n.mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(n.name)}`);
      res.send(buf);
    } catch (e) {
      res.status(500).end();
    }
  });

  // ---------- V1.0.2 受管文件（PRD/招投标/图册）与资料问答占位 ----------
  const CORPUS = ['prd', 'tender', 'catalog'];

  app.get('/api/admin/kb/managed/settings', (req, res) => {
    try {
      res.json(readManagedDb().settings);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/kb/managed/settings', (req, res) => {
    try {
      const body = req.body || {};
      const next = updateManagedSettings({
        ossBucketNote: body.ossBucketNote,
        fastgptAppIdNote: body.fastgptAppIdNote,
      });
      res.json(next);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/kb/managed/files', (req, res) => {
    try {
      let items = listManagedAll();
      const t = req.query.type;
      if (t && CORPUS.includes(String(t))) items = items.filter((x) => x.corpusType === t);
      const q = (req.query.q || '').toLowerCase();
      if (q) items = items.filter((x) => x.name.toLowerCase().includes(q));
      res.json({ items });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/kb/managed/files', (req, res) => {
    try {
      const { corpusType, name, mime, base64, ownerDeptId } = req.body || {};
      if (!corpusType || !CORPUS.includes(corpusType)) {
        return res.status(400).json({ error: 'corpusType 须为 prd | tender | catalog' });
      }
      if (!name || !base64) return res.status(400).json({ error: 'name、base64 必填' });
      const buf = Buffer.from(base64, 'base64');
      if (buf.length > KB_MAX_BYTES) return res.status(413).json({ error: 'too_large' });
      const deptIds = ownerDeptId ? [ownerDeptId] : ['dept-sales'];
      const item = addManagedFile({
        corpusType,
        name,
        mime,
        size: buf.length,
        buffer: buf,
        deptIds,
        uploadedBy: 'admin',
      });
      res.json({ id: item.id, item });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/kb/managed/files/:id/retry', (req, res) => {
    try {
      const r = retryManagedVector(req.params.id);
      if (!r.ok) return res.status(404).json({ error: r.error });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/kb/me/managed/files', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) return res.status(403).json({ error: 'no_dept' });
      const items = listManagedForDepts(deptIds);
      res.json({ items });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/kb/me/managed/files', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) return res.status(403).json({ error: 'no_dept' });
      const { corpusType, name, mime, base64 } = req.body || {};
      if (!corpusType || !CORPUS.includes(corpusType)) {
        return res.status(400).json({ error: 'corpusType 须为 prd | tender | catalog' });
      }
      if (!name || !base64) return res.status(400).json({ error: 'name、base64 必填' });
      const buf = Buffer.from(base64, 'base64');
      if (buf.length > KB_MAX_BYTES) return res.status(413).json({ error: 'too_large' });
      const item = addManagedFile({
        corpusType,
        name,
        mime,
        size: buf.length,
        buffer: buf,
        deptIds,
        uploadedBy: parseUserLabel(req),
      });
      res.json({ id: item.id, item });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/kb/me/managed/files/:id/retry', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) return res.status(403).json({ error: 'no_dept' });
      const it = listManagedForDepts(deptIds).find((x) => x.id === req.params.id);
      if (!it) return res.status(404).json({ error: 'not_found' });
      retryManagedVector(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /** 资料问答占位：真实环境对接 FastGPT；此处仅校验部门上下文并返回说明性答复 */
  app.post('/api/kb/me/qa', (req, res) => {
    try {
      const deptIds = parseDeptIds(req);
      if (!deptIds.length) return res.status(403).json({ error: 'no_dept', message: '缺少部门上下文' });
      const { message } = req.body || {};
      const q = String(message || '').trim();
      if (!q) return res.status(400).json({ error: 'message 必填' });
      const db = readDb();
      const demoNote =
        '【演示】本接口为 V1.0.2 资料问答占位：生产环境将仅检索您有权且已入库的部门资料与受管文件（PRD/招投标/图册），并排除黑名单路径。';
      if (/黑名单|不参与|敏感/i.test(q)) {
        return res.json({
          answer: `${demoNote} 若某目录在管理后台被标记为「不参与知识库/问答」，其下内容不会出现在检索结果中。`,
          citations: [],
        });
      }
      const hits = searchNodesAdmin(db, q.slice(0, 40)).filter((n) => !n.deleted && n.type === 'file');
      const visible = hits.filter((n) => canReadNode(db, n.id, deptIds) && !isPathExcludedFromKb(db, n.id));
      if (!visible.length) {
        return res.json({
          answer: `${demoNote} 当前未在可检索资料中命中与您问题直接相关的条款或文件名；请确认文件已上传且向量同步成功，或调整关键词。`,
          citations: [],
        });
      }
      const top = visible.slice(0, 3).map((n) => ({ name: n.name, nodeId: n.id }));
      return res.json({
        answer: `${demoNote} 在您的可见范围内找到 ${visible.length} 个可能相关的文件，例如：${top.map((t) => `《${t.name}》`).join('、')}。请打开「部门资料」查看原文。`,
        citations: top,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}
