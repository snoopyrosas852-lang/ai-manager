/**
 * QA 知识库配置存储：问答策略、评估体系、数据评测集、模型效果评估
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, 'data', 'qa-knowledge.json');

const DEFAULT = {
  qaStrategy: {
    retrievalTopK: 5,
    rerankEnabled: true,
    similarityThreshold: 0.7,
    fallbackToGenerate: true,
    chunkSize: 500,
    overlap: 50,
  },
  evaluationSystem: {
    metrics: ['accuracy', 'relevance', 'faithfulness', 'latency'],
    accuracyWeight: 0.4,
    relevanceWeight: 0.3,
    faithfulnessWeight: 0.2,
    latencyWeight: 0.1,
  },
  evalDatasets: [],
  evalItems: [],
  modelEvaluations: [],
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

export function getQAKnowledge() {
  return read();
}

export function updateQAKnowledge(payload) {
  const current = read();
  const next = { ...current };
  if (payload.qaStrategy) next.qaStrategy = { ...current.qaStrategy, ...payload.qaStrategy };
  if (payload.evaluationSystem) next.evaluationSystem = { ...current.evaluationSystem, ...payload.evaluationSystem };
  if (payload.evalDatasets) next.evalDatasets = payload.evalDatasets;
  if (payload.evalItems) next.evalItems = payload.evalItems;
  if (payload.modelEvaluations) next.modelEvaluations = payload.modelEvaluations;
  write(next);
  return next;
}

export function addEvalDataset(name, description, projectId) {
  const data = read();
  const id = `ds-${Date.now()}`;
  const item = { id, name, description, projectId: projectId || 'default', itemCount: 0, createdAt: new Date().toISOString() };
  data.evalDatasets = data.evalDatasets || [];
  data.evalDatasets.push(item);
  write(data);
  return item;
}

export function addEvalItem(datasetId, question, expectedAnswer, metadata = {}) {
  const data = read();
  const id = `ei-${Date.now()}`;
  const item = { id, datasetId, question, expectedAnswer, metadata, createdAt: new Date().toISOString() };
  data.evalItems = data.evalItems || [];
  data.evalItems.push(item);
  const ds = data.evalDatasets?.find((d) => d.id === datasetId);
  if (ds) ds.itemCount = (ds.itemCount || 0) + 1;
  write(data);
  return item;
}

export function addModelEvaluation(datasetId, modelName, metrics, totalCases, passedCases) {
  const data = read();
  const id = `eval-${Date.now()}`;
  const item = {
    id,
    datasetId,
    modelName,
    runAt: new Date().toISOString(),
    metrics: metrics || {},
    totalCases: totalCases || 0,
    passedCases: passedCases || 0,
  };
  data.modelEvaluations = data.modelEvaluations || [];
  data.modelEvaluations.push(item);
  write(data);
  return item;
}
