import { http } from './http';

export interface MultiTurnRule {
  id: string;
  condition: string;
  action: string;
  suggestedQuestion?: string;
}

export interface IntentSwitchRule {
  id: string;
  triggerKeywords: string[];
  action: string;
  description: string;
}

export interface IntentIteration {
  id: string;
  version: number;
  promptSnapshot: string;
  createdAt: string;
  metrics: Record<string, number>;
}

/** OpenClaw 风格：意图由 Skill description 隐式定义，此处仅保留系统 Prompt 与规则 */
export interface IntentSystemConfig {
  systemPrompt: string;
  multiTurnRules: MultiTurnRule[];
  intentSwitchRules: IntentSwitchRule[];
  iterations: IntentIteration[];
}

export async function getIntentSystem(): Promise<IntentSystemConfig> {
  return http.get<IntentSystemConfig>('/api/admin/intent-system');
}

export async function updateIntentSystem(payload: Partial<IntentSystemConfig>): Promise<IntentSystemConfig> {
  return http.put<IntentSystemConfig>('/api/admin/intent-system', payload);
}

export async function addIntentIteration(metrics: { promptSnapshot?: string; metrics?: Record<string, number> }): Promise<IntentSystemConfig> {
  return http.post<IntentSystemConfig>('/api/admin/intent-system/iterations', metrics);
}
