import { useState, useMemo } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { runTestCases, getTestCases } from '../../api/testcases';
import type { TestRunResult as TestRunResultType } from '../../types/testcase';
import TestCaseList from './TestCaseList';
import TestRunHistory from './TestRunHistory';
import TestRunResult from './TestRunResult';

const TABS = [
  { key: 'cases', label: '用例管理' },
  { key: 'history', label: '执行历史' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function TestBench() {
  const [activeTab, setActiveTab] = useState<TabKey>('cases');
  const [groupFilter, setGroupFilter] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<TestRunResultType | null>(null);

  useState(() => {
    getTestCases().then((cases) => {
      const set = new Set(cases.map((c) => c.group));
      setGroups(Array.from(set).sort());
    }).catch(() => {});
  });

  async function handleBatchRun() {
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const result = await runTestCases(groupFilter || undefined);
      setBatchResult(result);
    } catch {
      alert('批量执行失败');
    } finally {
      setBatchRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">测试工作台</h1>
          <p className="text-sm text-gray-500 mt-1">管理意图识别测试用例并批量执行回归测试</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部分组</option>
            {groups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button
            onClick={handleBatchRun}
            disabled={batchRunning}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            批量执行
          </button>
        </div>
      </div>

      {/* Batch Result */}
      {(batchResult || batchRunning) && (
        <TestRunResult result={batchResult} loading={batchRunning} />
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'cases' && <TestCaseList />}
        {activeTab === 'history' && <TestRunHistory />}
      </div>
    </div>
  );
}
