import { useState, useEffect } from 'react';
import { Eye, Loader2, Clock } from 'lucide-react';
import { getTestRuns } from '../../api/testcases';
import type { TestRunResult as TestRunResultType } from '../../types/testcase';
import TestRunResult from './TestRunResult';

export default function TestRunHistory() {
  const [runs, setRuns] = useState<TestRunResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<TestRunResultType | null>(null);

  useEffect(() => {
    fetchRuns();
  }, []);

  async function fetchRuns() {
    setLoading(true);
    try {
      const data = await getTestRuns();
      setRuns(data);
    } catch {
      alert('获取执行历史失败');
    } finally {
      setLoading(false);
    }
  }

  if (selectedRun) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedRun(null)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 返回列表
        </button>
        <TestRunResult result={selectedRun} loading={false} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
        </div>
      ) : runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Clock className="w-8 h-8 mb-2" />
          <p className="text-sm">暂无执行历史</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">执行时间</th>
                <th className="px-4 py-3 font-medium">用例数</th>
                <th className="px-4 py-3 font-medium">通过率</th>
                <th className="px-4 py-3 font-medium w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const passRate = run.passRate * 100;
                const barColor = passRate >= 90 ? 'bg-green-500' : passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500';

                return (
                  <tr key={run.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-800">
                      {new Date(run.runAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{run.totalCases}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${barColor}`}
                            style={{ width: `${passRate}%` }}
                          />
                        </div>
                        <span className="text-gray-700 font-medium">{passRate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" /> 查看
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
