import { http } from './http';
import type {
  IntentTestRequest,
  IntentTestResponse,
  RewriteTestRequest,
  RewriteTestResponse,
  SummaryTestRequest,
  SummaryTestResponse,
} from '../types/debug';

export async function testIntent(req: IntentTestRequest): Promise<IntentTestResponse> {
  return http.post<IntentTestResponse>('/api/admin/debug/intent', req);
}

export async function testRewrite(req: RewriteTestRequest): Promise<RewriteTestResponse> {
  return http.post<RewriteTestResponse>('/api/admin/debug/rewrite', req);
}

export async function testSummary(req: SummaryTestRequest): Promise<SummaryTestResponse> {
  return http.post<SummaryTestResponse>('/api/admin/debug/summary', req);
}
