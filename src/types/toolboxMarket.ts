export interface ToolboxAppStat {
  toolId: string;
  toolName: string;
  category: string;
  opens: number;
  jobStarts: number;
  jobCompletes: number;
  lastAt: number;
}

export interface ToolboxActivityItem {
  at: number;
  type: string;
  toolId: string;
  toolName: string;
  category: string;
  jobId?: string;
  progress?: number;
  status?: string;
  message?: string;
}

export interface ToolboxFeedbackItem {
  at: number;
  text: string;
  contact?: string;
  clientHint?: string;
}

export interface ToolboxMarketResponse {
  apps: ToolboxAppStat[];
  totals: { opens: number; jobStarts: number; jobCompletes: number };
  activity: ToolboxActivityItem[];
  feedback: ToolboxFeedbackItem[];
}
