import { http } from './http';
import { shouldUseMock } from './env';
import type {
  CostOverview,
  CostTrendPoint,
  ModelDistribution,
  SkillDistribution,
  UserRanking,
} from '../types/cost';
import {
  MOCK_COST_OVERVIEW,
  mockCostTrend,
  MOCK_MODEL_DIST,
  MOCK_SKILL_DIST,
  MOCK_USER_RANK,
} from './mockAdmin';

async function withMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  if (shouldUseMock()) return mock;
  try {
    return await fn();
  } catch {
    return mock;
  }
}

export async function getCostOverview(
  dateFrom?: string,
  dateTo?: string,
): Promise<CostOverview> {
  return withMock(
    () => http.get<CostOverview>('/api/admin/cost/overview', { dateFrom, dateTo }),
    MOCK_COST_OVERVIEW
  );
}

export async function getCostTrend(
  days: number,
  dateFrom?: string,
  dateTo?: string,
): Promise<CostTrendPoint[]> {
  return withMock(
    () => http.get<CostTrendPoint[]>('/api/admin/cost/trend', { days, dateFrom, dateTo }),
    mockCostTrend(days || 7)
  );
}

export async function getModelDistribution(
  dateFrom?: string,
  dateTo?: string,
): Promise<ModelDistribution[]> {
  return withMock(
    () => http.get<ModelDistribution[]>('/api/admin/cost/model-distribution', { dateFrom, dateTo }),
    MOCK_MODEL_DIST
  );
}

export async function getSkillDistribution(
  dateFrom?: string,
  dateTo?: string,
): Promise<SkillDistribution[]> {
  return withMock(
    () => http.get<SkillDistribution[]>('/api/admin/cost/skill-distribution', { dateFrom, dateTo }),
    MOCK_SKILL_DIST
  );
}

export async function getUserRanking(
  top?: number,
  dateFrom?: string,
  dateTo?: string,
): Promise<UserRanking[]> {
  return withMock(
    () => http.get<UserRanking[]>('/api/admin/cost/user-ranking', { top, dateFrom, dateTo }),
    MOCK_USER_RANK.slice(0, top || 10)
  );
}
