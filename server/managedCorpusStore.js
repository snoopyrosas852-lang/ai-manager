/**
 * V1.0.2 受管文件（PRD / 招投标 / 图册）— 元数据 + 本地 blob
 * 与部门云盘分离；同步 FastGPT 在本 demo 中为状态机模拟
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'managedCorpus.json');
const BLOB_DIR = path.join(DATA_DIR, 'managed-blobs');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BLOB_DIR)) fs.mkdirSync(BLOB_DIR, { recursive: true });
}

function defaultDb() {
  return {
    items: [],
    settings: {
      ossBucketNote: '',
      fastgptAppIdNote: '',
    },
  };
}

export function readManagedDb() {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) {
    const d = defaultDb();
    writeManagedDb(d);
    return d;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const d = JSON.parse(raw);
    if (!d.items) d.items = [];
    if (!d.settings) d.settings = defaultDb().settings;
    return d;
  } catch {
    const d = defaultDb();
    writeManagedDb(d);
    return d;
  }
}

export function writeManagedDb(data) {
  ensureDirs();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function listManagedForDepts(deptIds) {
  const db = readManagedDb();
  if (!deptIds?.length) return [];
  const set = new Set(deptIds);
  return db.items.filter((it) => (it.deptIds || []).some((d) => set.has(d)));
}

export function listManagedAll() {
  return readManagedDb().items;
}

export function getManagedItem(id) {
  return readManagedDb().items.find((x) => x.id === id) || null;
}

function writeManagedBlob(id, buffer) {
  ensureDirs();
  fs.writeFileSync(path.join(BLOB_DIR, id), buffer);
}

/** 模拟异步入队 → 成功（可改为真实队列） */
function scheduleVectorSim(id) {
  const tick = () => {
    const db = readManagedDb();
    const it = db.items.find((x) => x.id === id);
    if (!it) return;
    it.vectorStatus = 'syncing';
    it.updatedAt = new Date().toISOString();
    writeManagedDb(db);
    setTimeout(() => {
      const d2 = readManagedDb();
      const it2 = d2.items.find((x) => x.id === id);
      if (!it2) return;
      it2.vectorStatus = 'success';
      it2.error = null;
      it2.updatedAt = new Date().toISOString();
      writeManagedDb(d2);
    }, 1200 + Math.floor(Math.random() * 800));
  };
  setTimeout(tick, 400);
}

export function addManagedFile({ corpusType, name, mime, size, buffer, deptIds, uploadedBy }) {
  const db = readManagedDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const item = {
    id,
    corpusType,
    name,
    mime: mime || 'application/octet-stream',
    size,
    deptIds: [...(deptIds || [])],
    vectorStatus: 'queued',
    error: null,
    uploadedBy: uploadedBy || '—',
    createdAt: now,
    updatedAt: now,
  };
  db.items.unshift(item);
  writeManagedDb(db);
  writeManagedBlob(id, buffer);
  scheduleVectorSim(id);
  return item;
}

export function retryManagedVector(id) {
  const db = readManagedDb();
  const it = db.items.find((x) => x.id === id);
  if (!it) return { ok: false, error: 'not_found' };
  it.vectorStatus = 'queued';
  it.error = null;
  it.updatedAt = new Date().toISOString();
  writeManagedDb(db);
  scheduleVectorSim(id);
  return { ok: true };
}

export function updateManagedSettings(partial) {
  const db = readManagedDb();
  db.settings = { ...db.settings, ...partial };
  writeManagedDb(db);
  return db.settings;
}
