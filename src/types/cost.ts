export interface CostOverview {
  totalCostYuan: number;
  todayCostYuan: number;
  todayTokens: number;
  avgSessionCost: number;
  totalSessions: number;
  totalMessages: number;
}

export interface CostTrendPoint {
  date: string;
  costYuan: number;
  tokens: number;
}

export interface ModelDistribution {
  model: string;
  calls: number;
  tokens: number;
  costYuan: number;
  percentage: number;
}

export interface SkillDistribution {
  skill: string;
  skillName: string;
  calls: number;
  tokens: number;
  costYuan: number;
}

export interface UserRanking {
  userId: number;
  userName: string;
  totalTokens: number;
  totalCostYuan: number;
  sessionCount: number;
}
