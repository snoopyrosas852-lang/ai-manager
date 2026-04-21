export interface IntentTestRequest {
  userMessage: string;
  conversationHistory?: { role: string; content: string }[];
  projectId?: string;
}

export interface IntentTestResponse {
  result: {
    skill: string | null;
    intent: string;
    apiParams: Record<string, any>;
    confidence: number;
  };
  rawLlmOutput: string;
  tokenUsage: { input: number; output: number; cost: number };
  latencyMs: number;
}

export interface RewriteTestRequest {
  userMessage: string;
  conversationHistory?: { role: string; content: string }[];
}

export interface RewriteTestResponse {
  original: string;
  rewritten: string;
  projectId: string | null;
  needsClarification: boolean;
  clarificationQuestion?: string;
  rawLlmOutput?: string;
  latencyMs: number;
}

export interface SummaryTestRequest {
  skill: string;
  apiResponseJson: string;
  projectId?: string;
}

export interface SummaryTestResponse {
  summary: string;
  tokenUsage: { input: number; output: number; cost: number };
  latencyMs: number;
}
