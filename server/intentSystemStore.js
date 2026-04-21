/**
 * 意图/路由配置 - OpenClaw 风格
 * 意图由 Skill 的 description 隐式定义，此处仅保留：系统 Prompt、多轮规则、切换规则、迭代记录
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'intent-system.json');

const DEFAULT = {
  systemPrompt: `你是咸亨小仙 AI 助理。根据用户消息和对话历史，选择合适的工具并回复。

可用工具（Skills）由下方列表注入，每个工具包含 name、description、instructions。
- 根据 description 和 instructions 判断何时调用该工具
- 若用户表达不完整，可追问澄清
- 若用户明确切换话题（如「换个」「不是，我要查xxx」），可重置上下文`,
  multiTurnRules: [],
  intentSwitchRules: [],
  iterations: [],
};

function ensureDir() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) return JSON.parse(JSON.stringify(DEFAULT));
  try {
    const raw = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    return migrate(raw);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function migrate(raw) {
  if (raw.intentSystem) {
    const is = raw.intentSystem;
    return {
      systemPrompt: is.prompts?.intentRecognition || raw.systemPrompt || DEFAULT.systemPrompt,
      multiTurnRules: is.multiTurnRules || raw.multiTurnRules || [],
      intentSwitchRules: is.intentSwitchRules || raw.intentSwitchRules || [],
      iterations: is.iterations || raw.iterations || [],
    };
  }
  return { ...DEFAULT, ...raw };
}

function write(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getIntentSystem() {
  return read();
}

export function updateIntentSystem(payload) {
  const current = read();
  const next = {
    systemPrompt: payload.systemPrompt !== undefined ? payload.systemPrompt : current.systemPrompt,
    multiTurnRules: payload.multiTurnRules !== undefined ? payload.multiTurnRules : current.multiTurnRules,
    intentSwitchRules: payload.intentSwitchRules !== undefined ? payload.intentSwitchRules : current.intentSwitchRules,
    iterations: payload.iterations !== undefined ? payload.iterations : current.iterations,
  };
  write(next);
  return next;
}

export function addIntentIteration(metrics) {
  const data = read();
  const iters = data.iterations || [];
  const nextVersion = iters.length + 1;
  iters.push({
    id: `v${nextVersion}`,
    version: nextVersion,
    promptSnapshot: metrics.promptSnapshot || `v${nextVersion}`,
    createdAt: new Date().toISOString(),
    metrics: metrics.metrics || {},
  });
  data.iterations = iters;
  write(data);
  return data;
}
