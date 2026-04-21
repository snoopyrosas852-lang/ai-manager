import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { TestRunResult as TestRunResultType } from '../../types/testcase';

interface TestRunResultProps {
  result: TestRunResultType | null;
  loading: boolean;
}

export default function TestRunResult({ result, loading }: TestRunResultProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        正在执行批量测试...
      </div>
    );
  }

  if (!result) return null;

  const passRate = result.passRate * 100;
  const barColor = passRate >= 90 ? 'bg-green-500' : passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">测试结果摘要</h3>
          <span className="text-sm font-medium text-gray-800">
            {result.passedCases}/{result.totalCases} 通过 ({passRate.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${barColor}`}
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium w-10">#</th>
                <th className="px-4 py-3 font-medium">用户输入</th>
                <th className="px-4 py-3 font-medium">期望 Skill</th>
                <th className="px-4 py-3 font-medium">实际 Skill</th>
                <th className="px-4 py-3 font-medium">期望 Intent</th>
                <th className="px-4 py-3 font-medium">实际 Intent</th>
                <th className="px-4 py-3 font-medium w-16">结果</th>
                <th className="px-4 py-3 font-medium w-20">耗时</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r, idx) => {
                const skillMatch = r.expected?.skill === r.actual?.skill;
                const intentMatch = r.expected?.intent === r.actual?.intent;

                return (
                  <tr
                    key={r.caseId}
                    className={`border-t border-gray-100 ${!r.passed ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{r.userMessage}</td>
                    <td className="px-4 py-3 text-gray-600">{r.expected?.skill ?? '-'}</td>
                    <td className={`px-4 py-3 ${!skillMatch ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {r.actual?.skill ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.expected?.intent ?? '-'}</td>
                    <td className={`px-4 py-3 ${!intentMatch ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {r.actual?.intent ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      {r.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.latencyMs} ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
