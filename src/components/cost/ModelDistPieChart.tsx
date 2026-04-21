import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { ModelDistribution } from '../../types/cost';

interface ModelDistPieChartProps {
  data: ModelDistribution[];
  loading: boolean;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ModelDistribution;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900">{item.model}</p>
      <p className="text-gray-600">调用次数: {item.calls.toLocaleString()}</p>
      <p className="text-gray-600">占比: {item.percentage.toFixed(1)}%</p>
      <p className="text-gray-600">费用: ¥{item.costYuan.toFixed(2)}</p>
    </div>
  );
}

function renderLegend(props: any) {
  const { payload } = props;
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ModelDistPieChart({ data, loading }: ModelDistPieChartProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">模型用量分布</h3>

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
          <PieChart>
            <Pie
              data={data}
              dataKey="calls"
              nameKey="model"
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
