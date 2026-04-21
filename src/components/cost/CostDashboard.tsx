import { useState, useEffect, useCallback } from 'react';
import { useRole } from '../../hooks/useRole';
import {
  getCostOverview,
  getCostTrend,
  getModelDistribution,
  getSkillDistribution,
  getUserRanking,
} from '../../api/cost';
import type { CostOverview, CostTrendPoint, ModelDistribution, SkillDistribution, UserRanking } from '../../types/cost';
import DateRangeFilter, { type DateRangeValue } from './DateRangeFilter';
import StatCards from './StatCards';
import CostTrendChart from './CostTrendChart';
import ModelDistPieChart from './ModelDistPieChart';
import SkillDistBarChart from './SkillDistBarChart';
import UserRankTable from './UserRankTable';

const PRESET_DAYS: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30 };

function getDateRange(value: DateRangeValue) {
  if (value.preset !== 'custom') {
    const days = PRESET_DAYS[value.preset];
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return {
      days,
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    };
  }
  return { days: 0, dateFrom: value.dateFrom, dateTo: value.dateTo };
}

export default function CostDashboard() {
  const { isOperator, isAdmin } = useRole();
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: '7d' });
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<CostOverview | null>(null);
  const [trend, setTrend] = useState<CostTrendPoint[]>([]);
  const [modelDist, setModelDist] = useState<ModelDistribution[]>([]);
  const [skillDist, setSkillDist] = useState<SkillDistribution[]>([]);
  const [userRank, setUserRank] = useState<UserRanking[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { days, dateFrom, dateTo } = getDateRange(dateRange);
      const results = await Promise.all([
        getCostOverview(dateFrom, dateTo),
        getCostTrend(days || 7, dateFrom, dateTo),
        getModelDistribution(dateFrom, dateTo),
        getSkillDistribution(dateFrom, dateTo),
        isAdmin ? getUserRanking(10, dateFrom, dateTo) : Promise.resolve([]),
      ]);
      setOverview(results[0]);
      setTrend(results[1]);
      setModelDist(results[2]);
      setSkillDist(results[3]);
      setUserRank(results[4]);
    } catch (err) {
      console.error('Failed to fetch cost data', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, isAdmin]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">
          成本看板
          {isOperator && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
              只读
            </span>
          )}
        </h2>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <StatCards data={overview} loading={loading} />

      <CostTrendChart data={trend} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ModelDistPieChart data={modelDist} loading={loading} />
        <SkillDistBarChart data={skillDist} loading={loading} />
      </div>

      <UserRankTable data={userRank} loading={loading} />
    </div>
  );
}
