export interface SessionListItem {
  id: string;
  userId: number;
  userName: string;
  title: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  rating: 'up' | 'down' | null;
  skill: string | null;
  projectId: string | null;
  createdAt: string;
}

export interface SessionDetail {
  session: {
    id: string;
    userId: number;
    userName: string;
    title: string;
    createdAt: string;
    totalTokens: number;
    totalCost: number;
  };
  messages: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  msgType: string;
  cardData: any;
  createdAt: string;
  debug?: DebugInfo;
  feedback?: { rating: 'up' | 'down'; createdAt: string };
}

export interface DebugInfo {
  skill: string | null;
  intent: string;
  confidence: number;
  extractedParams: Record<string, any>;
  apiParams: Record<string, any>;
  queryRewrite?: string;
  projectId?: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costYuan: number;
  ttftMs: number;
  totalMs: number;
  rawLlmOutput?: string;
  rawApiResponse?: any;
}

export interface SessionFilter {
  userName?: string;
  dateFrom?: string;
  dateTo?: string;
  rating?: 'up' | 'down' | 'none';
  skill?: string;
  projectId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'totalTokens' | 'rating';
  sortOrder?: 'asc' | 'desc';
}
