/**
 * Skill 存储 - OpenClaw 风格
 * 每个 Skill = description + instructions，LLM 根据描述隐式判断何时调用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'skills.json');

const DEFAULT_SKILLS = [
  {
    id: 'order_query',
    name: '订单查询',
    description: '查询订单状态、物流信息、待交付/在途订单',
    instructions: '当用户询问订单、物流、发货、到货、待交付、在途等时使用。结合项目考核红线提醒用户。',
    useWhen: ['查订单', '物流到哪了', '待交付', '发货情况', '本月在途'],
    doNotUse: ['查商品规格', '查价格', '退货'],
    requires: { env: [], bins: [], config: [] },
    triggerExamples: ['查订单', '物流状态', '待交付订单'],
    requiredApis: ['order_list'],
    associatedProjects: [],
    enabled: true,
    userInvocable: true,
    disableModelInvocation: false,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'product_query',
    name: '商品查询',
    description: '查询商品信息、规格、价格',
    instructions: '当用户询问商品详情、规格、价格、库存时使用。',
    useWhen: ['查商品', '产品规格', '多少钱', '有货吗'],
    doNotUse: ['查订单', '物流', '签收'],
    requires: { env: [], bins: [], config: [] },
    triggerExamples: ['查商品', '产品规格'],
    requiredApis: [],
    associatedProjects: [],
    enabled: true,
    userInvocable: true,
    disableModelInvocation: false,
    updatedAt: new Date().toISOString(),
  },
];

function ensureDir() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) return JSON.parse(JSON.stringify(DEFAULT_SKILLS));
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SKILLS));
  }
}

function write(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/** 获取所有 Skill（用于 LLM 注入） */
export function getAllSkills() {
  return read().filter((s) => s.enabled !== false);
}

/** 获取 eligible Skill（满足 requires 的） */
export function getEligibleSkills(env = {}, config = {}) {
  const skills = getAllSkills();
  return skills.filter((s) => {
    const req = s.requires || {};
    if (req.env?.length) {
      if (!req.env.every((e) => env[e])) return false;
    }
    if (req.config?.length) {
      if (!req.config.every((c) => config[c])) return false;
    }
    return true;
  });
}

/** 按 ID 获取 */
export function getSkillById(id) {
  return read().find((s) => s.id === id) || null;
}

/** 创建或更新 */
export function upsertSkill(payload) {
  const list = read();
  const idx = list.findIndex((s) => s.id === payload.id);
  const now = new Date().toISOString();
  const item = {
    id: payload.id,
    name: payload.name || payload.id,
    description: payload.description || '',
    instructions: payload.instructions || '',
    useWhen: payload.useWhen || [],
    doNotUse: payload.doNotUse || [],
    requires: payload.requires || { env: [], bins: [], config: [] },
    triggerExamples: payload.triggerExamples || [],
    requiredApis: payload.requiredApis || [],
    associatedProjects: payload.associatedProjects || [],
    enabled: payload.enabled !== false,
    userInvocable: payload.userInvocable !== false,
    disableModelInvocation: payload.disableModelInvocation === true,
    updatedAt: now,
  };
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.push(item);
  }
  write(list);
  return item;
}

/** 删除 */
export function deleteSkill(id) {
  const list = read().filter((s) => s.id !== id);
  write(list);
  return true;
}

/** 批量更新（用于从 toolbar 同步） */
export function syncFromToolbar(toolbarItems) {
  const skillIdSet = new Set();
  (toolbarItems || []).forEach((item) => {
    (item.skillIds || []).forEach((sid) => skillIdSet.add(sid));
  });
  const list = read();
  const existing = new Set(list.map((s) => s.id));
  skillIdSet.forEach((id) => {
    if (!existing.has(id)) {
      list.push({
        id,
        name: id,
        description: '',
        instructions: '',
        useWhen: [],
        doNotUse: [],
        requires: { env: [], bins: [], config: [] },
        triggerExamples: [],
        requiredApis: [],
        associatedProjects: [],
        enabled: true,
        userInvocable: true,
        disableModelInvocation: false,
        updatedAt: new Date().toISOString(),
      });
    }
  });
  write(list);
  return list;
}
