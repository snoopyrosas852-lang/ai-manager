/**
 * Agent 配置存储：Plan、Action、能力评估
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'agent-config.json');

const DEFAULT = {
  planConfig: {
    enabled: true,
    maxSteps: 10,
    allowParallel: false,
    promptTemplate: '',
  },
  actionConfig: {
    trackExecutions: true,
    timeoutMs: 30000,
    retryCount: 2,
  },
  capabilityEvaluations: [],
  evalRuns: [],
};

function ensureDir() {
  const dir = path.dirname(FILE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(FILE_PATH)) return JSON.parse(JSON.stringify(DEFAULT));
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function write(data) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getAgentConfig() {
  return read();
}

export function updateAgentConfig(payload) {
  const current = read();
  const next = { ...current };
  if (payload.planConfig) next.planConfig = { ...current.planConfig, ...payload.planConfig };
  if (payload.actionConfig) next.actionConfig = { ...current.actionConfig, ...payload.actionConfig };
  if (payload.capabilityEvaluations) next.capabilityEvaluations = payload.capabilityEvaluations;
  if (payload.evalRuns) next.evalRuns = payload.evalRuns;
  write(next);
  return next;
}

export function addAgentEvalRun(scores, metrics = {}) {
  const data = read();
  const id = `run-${Date.now()}`;
  const item = {
    id,
    runAt: new Date().toISOString(),
    scores: scores || {},
    metrics,
  };
  data.evalRuns = data.evalRuns || [];
  data.evalRuns.push(item);
  write(data);
  return item;
}
