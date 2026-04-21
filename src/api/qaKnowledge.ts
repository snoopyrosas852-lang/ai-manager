import { http } from './http';

export interface QAStrategy {
  retrievalTopK: number;
  rerankEnabled: boolean;
  similarityThreshold: number;
  fallbackToGenerate: boolean;
  chunkSize: number;
  overlap: number;
}

export interface EvaluationSystem {
  metrics: string[];
  accuracyWeight: number;
  relevanceWeight: number;
  faithfulnessWeight: number;
  latencyWeight: number;
}

export interface EvalDataset {
  id: string;
  name: string;
  description: string;
  projectId: string;
  itemCount: number;
  createdAt: string;
}

export interface EvalItem {
  id: string;
  datasetId: string;
  question: string;
  expectedAnswer: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ModelEvaluation {
  id: string;
  datasetId: string;
  modelName: string;
  runAt: string;
  metrics: Record<string, number>;
  totalCases: number;
  passedCases: number;
}

export interface QAKnowledgeConfig {
  qaStrategy: QAStrategy;
  evaluationSystem: EvaluationSystem;
  evalDatasets: EvalDataset[];
  evalItems: EvalItem[];
  modelEvaluations: ModelEvaluation[];
}

export async function getQAKnowledge(): Promise<QAKnowledgeConfig> {
  return http.get<QAKnowledgeConfig>('/api/admin/qa-knowledge');
}

export async function updateQAKnowledge(payload: Partial<QAKnowledgeConfig>): Promise<QAKnowledgeConfig> {
  return http.put<QAKnowledgeConfig>('/api/admin/qa-knowledge', payload);
}

export async function addEvalDataset(data: { name: string; description?: string; projectId?: string }): Promise<EvalDataset> {
  return http.post<EvalDataset>('/api/admin/qa-knowledge/datasets', data);
}

export async function addEvalItem(data: {
  datasetId: string;
  question: string;
  expectedAnswer?: string;
  metadata?: Record<string, unknown>;
}): Promise<EvalItem> {
  return http.post<EvalItem>('/api/admin/qa-knowledge/eval-items', data);
}

export async function addModelEvaluation(data: {
  datasetId: string;
  modelName: string;
  metrics?: Record<string, number>;
  totalCases?: number;
  passedCases?: number;
}): Promise<ModelEvaluation> {
  return http.post<ModelEvaluation>('/api/admin/qa-knowledge/model-evaluations', data);
}
