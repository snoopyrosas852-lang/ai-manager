/**
 * 百宝箱编排配置（管理后台）- 文件持久化
 * 与前台 assistant 的 registry 解耦；后续可通过同步任务或公开接口下发。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'toolbox-config.json');

const DEFAULT_CONFIG = {
  mode: 'single_draft',
  versionLabel: '唯一生效版本',
  updatedAt: new Date().toISOString(),
  cards: [
    {
      id: 'card-xh-01',
      title: '物料类目匹配（咸亨平台）',
      subtitle: '基础字段负责前台展示，动作列表决定点击后的真实执行方式。',
      enabled: true,
      favoritable: true,
      actions: [{ id: 'act-1', name: '类目匹配主流程', kind: 'internal', notes: '' }],
    },
    {
      id: 'card-xh-02',
      title: '物料映射分析（咸亨平台）',
      subtitle: '下载模板并在既有映射工作流中提交；本页提供入口与留档说明。',
      enabled: true,
      favoritable: true,
      actions: [{ id: 'act-2', name: '映射工作流', kind: 'http', notes: '' }],
    },
    {
      id: 'card-xh-03',
      title: '商品对比智能分析（咸亨平台）',
      subtitle: '多商品参数对比与结论摘要（演示入口）。',
      enabled: true,
      favoritable: false,
      actions: [{ id: 'act-3', name: '对比分析', kind: 'internal', notes: '' }],
    },
    {
      id: 'card-xh-04',
      title: '商品图片稽查',
      subtitle: '按规则批量校验主图/附图，输出待整改清单。',
      enabled: true,
      favoritable: true,
      actions: [{ id: 'act-4', name: '稽查任务', kind: 'python', notes: '' }],
    },
    {
      id: 'card-xls-06',
      title: 'CSV ⇄ Excel 互转',
      subtitle: '系统导出 CSV 转 xlsx 再分发。',
      enabled: true,
      favoritable: false,
      actions: [{ id: 'act-5', name: '格式转换', kind: 'internal', notes: '' }],
    },
    {
      id: 'card-pdf-01',
      title: 'PDF 合并',
      subtitle: '多份附件合成一份归档。',
      enabled: true,
      favoritable: false,
      actions: [{ id: 'act-6', name: '合并任务', kind: 'python', notes: '' }],
    },
  ],
};

function ensureDir() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

function write(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalizeBody(body) {
  if (!body || typeof body !== 'object') return null;
  const cards = Array.isArray(body.cards) ? body.cards : null;
  if (!cards) return null;
  const versionLabel =
    typeof body.versionLabel === 'string' && body.versionLabel.trim()
      ? body.versionLabel.trim()
      : '唯一生效版本';
  const mode = body.mode === 'published' ? 'published' : 'single_draft';
  const out = {
    mode,
    versionLabel,
    updatedAt: new Date().toISOString(),
    cards: cards.map((c, i) => {
      const id = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `card-${Date.now()}-${i}`;
      const title = String(c.title || `百宝箱 ${i + 1}`).slice(0, 200);
      const subtitle = String(c.subtitle || '').slice(0, 2000);
      const actions = Array.isArray(c.actions)
        ? c.actions.map((a, j) => ({
            id:
              typeof a?.id === 'string' && a.id.trim()
                ? a.id.trim()
                : `act-${Date.now()}-${j}`,
            name: String(a?.name || `动作 ${j + 1}`).slice(0, 120),
            kind: ['python', 'http', 'internal'].includes(a?.kind) ? a.kind : 'internal',
            notes: String(a?.notes || '').slice(0, 2000),
          }))
        : [];
      return {
        id,
        title,
        subtitle,
        enabled: c.enabled !== false,
        favoritable: !!c.favoritable,
        actions,
      };
    }),
  };
  return out;
}

export function getToolboxConfig() {
  return read();
}

export function setToolboxConfig(body) {
  const next = normalizeBody(body);
  if (!next) {
    const err = new Error('Invalid payload');
    err.code = 'VALIDATION';
    throw err;
  }
  write(next);
  return next;
}
