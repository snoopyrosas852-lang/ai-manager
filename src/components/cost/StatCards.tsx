import { DollarSign, TrendingUp, Hash, Activity } from 'lucide-react';
import type { CostOverview } from '../../types/cost';

interface StatCardsProps {
  data: CostOverview | null;
  loading: boolean;
}

function formatCost(n: number): string {
  return `¥${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const CARDS = [
  {
    key: 'total',
    label: '累计费用(¥)',
    icon: DollarSign,
    color: 'bg-blue-100 text-blue-600',
    getValue: (d: CostOverview) => formatCost(d.totalCostYuan),
  },
  {
    key: 'today',
    label: '今日费用(¥)',
    icon: TrendingUp,
    color: 'bg-emerald-100 text-emerald-600',
    getValue: (d: CostOverview) => formatCost(d.todayCostYuan),
  },
  {
    key: 'tokens',
    label: '今日 Token 消耗',
    icon: Hash,
    color: 'bg-violet-100 text-violet-600',
    getValue: (d: CostOverview) => formatTokens(d.todayTokens),
  },
  {
    key: 'avg',
    label: '平均单次对话成本(¥)',
    icon: Activity,
    color: 'bg-amber-100 text-amber-600',
    getValue: (d: CostOverview) => formatCost(d.avgSessionCost),
  },
] as const;

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-6 w-20 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default function StatCards({ data, loading }: StatCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, color, getValue }) => (
        <div key={key} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-semibold text-gray-900">{getValue(data)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
