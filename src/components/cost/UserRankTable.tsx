import { Trophy } from 'lucide-react';
import { useRole } from '../../hooks/useRole';
import type { UserRanking } from '../../types/cost';

interface UserRankTableProps {
  data: UserRanking[];
  loading: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-700',
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3"><div className="h-4 w-6 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-4 w-14 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-4 w-10 rounded bg-gray-200" /></td>
        </tr>
      ))}
    </>
  );
}

export default function UserRankTable({ data, loading }: UserRankTableProps) {
  const { isAdmin } = useRole();

  if (!isAdmin) return null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-900">Token 消耗排行</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">排名</th>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">Token 消耗</th>
              <th className="px-4 py-3 font-medium">费用(¥)</th>
              <th className="px-4 py-3 font-medium">会话数</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              data.slice(0, 10).map((user, idx) => {
                const rank = idx + 1;
                const isTopThree = rank <= 3;
                return (
                  <tr
                    key={user.userId}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {isTopThree ? (
                        <Trophy className={`h-5 w-5 ${RANK_COLORS[rank]}`} />
                      ) : (
                        <span className="text-gray-500">{rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{user.userName}</td>
                    <td className="px-4 py-3 text-gray-700">{user.totalTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">¥{user.totalCostYuan.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-700">{user.sessionCount}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
