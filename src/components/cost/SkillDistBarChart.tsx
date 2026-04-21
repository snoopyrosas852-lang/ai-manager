import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { SkillDistribution } from '../../types/cost';

interface SkillDistBarChartProps {
  data: SkillDistribution[];
  loading: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as SkillDistribution;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-blue-600">调用次数: {item.calls.toLocaleString()}</p>
      <p className="text-gray-600">Token: {item.tokens.toLocaleString()}</p>
      <p className="text-emerald-600">费用: ¥{item.costYuan.toFixed(2)}</p>
    </div>
  );
}

export default function SkillDistBarChart({ data, loading }: SkillDistBarChartProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">Skill 调用分布</h3>

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
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="skillName"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="calls"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="cost"
              orientation="right"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `¥${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value: string) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
            <Bar yAxisId="calls" dataKey="calls" name="调用次数" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="cost" dataKey="costYuan" name="费用(¥)" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
