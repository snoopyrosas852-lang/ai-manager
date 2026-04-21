import { http } from './http';
import { shouldUseMock } from './env';
import type { TestCase, TestRunResult } from '../types/testcase';
import { MOCK_TEST_CASES, MOCK_TEST_RUNS } from './mockAdmin';

async function withMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  if (shouldUseMock()) return mock;
  try {
    return await fn();
  } catch {
    return mock;
  }
}

export async function getTestCases(group?: string): Promise<TestCase[]> {
  return withMock(
    () => http.get<TestCase[]>('/api/admin/testcases', { group }),
    group ? MOCK_TEST_CASES.filter((c) => c.group === group) : MOCK_TEST_CASES
  );
}

export async function createTestCase(
  data: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<TestCase> {
  try {
    return await http.post<TestCase>('/api/admin/testcases', data);
  } catch {
    return { ...data, id: `tc-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as TestCase;
  }
}

export async function updateTestCase(
  id: string,
  data: Partial<TestCase>,
): Promise<TestCase> {
  try {
    return await http.patch<TestCase>(`/api/admin/testcases/${id}`, data);
  } catch {
    return data as TestCase;
  }
}

export async function deleteTestCase(id: string): Promise<void> {
  try {
    await http.del<void>(`/api/admin/testcases/${id}`);
  } catch {
    return;
  }
}

export async function runTestCases(group?: string): Promise<TestRunResult> {
  return withMock(
    () => http.post<TestRunResult>('/api/admin/testcases/run', { group }),
    { ...MOCK_TEST_RUNS[0], id: `tr-${Date.now()}`, runAt: new Date().toISOString() }
  );
}

export async function getTestRuns(): Promise<TestRunResult[]> {
  return withMock(
    () => http.get<TestRunResult[]>('/api/admin/testcases/runs'),
    MOCK_TEST_RUNS
  );
}
