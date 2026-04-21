import { http } from './http';

export interface PlanConfig {
  enabled: boolean;
  maxSteps: number;
  allowParallel: boolean;
  promptTemplate: string;
}

export interface ActionConfig {
  trackExecutions: boolean;
  timeoutMs: number;
  retryCount: number;
}

export interface CapabilityEvaluation {
  id: string;
  name: string;
  description: string;
  metric: string;
  weight: number;
  lastScore: number;
}

export interface AgentEvalRun {
  id: string;
  runAt: string;
  scores: Record<string, number>;
  metrics?: Record<string, unknown>;
}

export interface AgentConfig {
  planConfig: PlanConfig;
  actionConfig: ActionConfig;
  capabilityEvaluations: CapabilityEvaluation[];
  evalRuns: AgentEvalRun[];
}

export async function getAgentConfig(): Promise<AgentConfig> {
  return http.get<AgentConfig>('/api/admin/agent-config');
}

export async function updateAgentConfig(payload: Partial<AgentConfig>): Promise<AgentConfig> {
  return http.put<AgentConfig>('/api/admin/agent-config', payload);
}

export async function addAgentEvalRun(data: { scores: Record<string, number>; metrics?: Record<string, unknown> }): Promise<AgentEvalRun> {
  return http.post<AgentEvalRun>('/api/admin/agent-config/eval-runs', data);
}
