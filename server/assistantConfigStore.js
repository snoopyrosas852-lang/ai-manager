/**
 * 前台助理配置存储 - JSON 文件
 * 包含：欢迎语、意图改写规则、输入框工具栏（每项可配置可用 skills）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'assistant-config.json');

const DEFAULT_CONFIG = {
  welcomeMessage: '我是小仙，有什么我能帮你的吗？',
  welcomeSubtext: '请先选择下方工具，然后输入您的问题',
  intentRewriteRules: [
    { id: 'rule-1', pattern: '违反.*中船考核红线', replacement: '触碰红线的订单', enabled: true },
  ],
  toolbar: [
    { id: 'order_query', label: '订单查询', skillIds: ['order_query'] },
  ],
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function read() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return {
      welcomeMessage: data.welcomeMessage ?? DEFAULT_CONFIG.welcomeMessage,
      welcomeSubtext: data.welcomeSubtext ?? DEFAULT_CONFIG.welcomeSubtext,
      intentRewriteRules: Array.isArray(data.intentRewriteRules) ? data.intentRewriteRules : DEFAULT_CONFIG.intentRewriteRules,
      toolbar: Array.isArray(data.toolbar) ? data.toolbar : DEFAULT_CONFIG.toolbar,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function write(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/** 获取当前配置（对外只读字段） */
export function getAssistantConfig() {
  return read();
}

/** 更新配置 */
export function updateAssistantConfig(payload) {
  const current = read();
  const next = {
    welcomeMessage: payload.welcomeMessage !== undefined ? payload.welcomeMessage : current.welcomeMessage,
    welcomeSubtext: payload.welcomeSubtext !== undefined ? payload.welcomeSubtext : current.welcomeSubtext,
    intentRewriteRules: payload.intentRewriteRules !== undefined ? payload.intentRewriteRules : current.intentRewriteRules,
    toolbar: payload.toolbar !== undefined ? payload.toolbar : current.toolbar,
  };
  write(next);
  return next;
}
