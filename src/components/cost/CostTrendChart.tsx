import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { CostTrendPoint } from '../../types/cost';

interface CostTrendChartProps {
  data: CostTrendPoint[];
  loading: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as CostTrendPoint;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-blue-600">费用: ¥{item.costYuan.toFixed(2)}</p>
      <p className="text-gray-500">Token: {item.tokens.toLocaleString()}</p>
    </div>
  );
}

export default function CostTrendChart({ data, loading }: CostTrendChartProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">成本趋势</h3>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-gray-400">
          暂无数据
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `¥${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="costYuan"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#costGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
