export interface TestCase {
  id: string;
  group: string;
  userMessage: string;
  projectContext?: string;
  conversationHistory?: any[];
  expected: {
    skill: string | null;
    intent: string;
    params?: Record<string, any>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TestRunResult {
  id: string;
  runAt: string;
  totalCases: number;
  passedCases: number;
  passRate: number;
  results: TestCaseResult[];
}

export interface TestCaseResult {
  caseId: string;
  userMessage: string;
  passed: boolean;
  expected: any;
  actual: any;
  diff: string[];
  latencyMs: number;
}
