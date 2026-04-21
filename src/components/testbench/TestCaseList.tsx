import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Upload, Download, Play, Pencil, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { getTestCases, createTestCase, updateTestCase, deleteTestCase, runTestCases } from '../../api/testcases';
import { testIntent } from '../../api/debug';
import type { TestCase } from '../../types/testcase';
import TestCaseForm from './TestCaseForm';

export default function TestCaseList() {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [editTarget, setEditTarget] = useState<TestCase | null | undefined>(undefined);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [singleResults, setSingleResults] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const set = new Set(cases.map((c) => c.group));
    return Array.from(set).sort();
  }, [cases]);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      if (groupFilter && c.group !== groupFilter) return false;
      if (searchQuery && !c.userMessage.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [cases, groupFilter, searchQuery]);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    try {
      const data = await getTestCases();
      setCases(data);
    } catch {
      alert('获取用例列表失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(data: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      if (editTarget) {
        await updateTestCase(editTarget.id, data);
      } else {
        await createTestCase(data);
      }
      setEditTarget(undefined);
      fetchCases();
    } catch {
      alert('保存失败');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除此用例？')) return;
    try {
      await deleteTestCase(id);
      fetchCases();
    } catch {
      alert('删除失败');
    }
  }

  async function handleSingleRun(tc: TestCase) {
    setRunningId(tc.id);
    try {
      const res = await testIntent({
        userMessage: tc.userMessage,
        projectId: tc.projectContext || undefined,
      });
      const passed =
        res.result.skill === tc.expected.skill && res.result.intent === tc.expected.intent;
      setSingleResults((prev) => ({ ...prev, [tc.id]: passed }));
    } catch {
      alert('执行失败');
    } finally {
      setRunningId(null);
    }
  }

  function handleExport() {
    const json = JSON.stringify(cases, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test-cases.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>[];
        for (const item of data) {
          await createTestCase(item);
        }
        fetchCases();
      } catch {
        alert('导入失败，请检查文件格式');
      }
    };
    input.click();
  }

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center gap-3">
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

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用例..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleImport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" /> 导入
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> 导出
          </button>
          <button
            onClick={() => setEditTarget(null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 新建用例
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">暂无用例数据</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-3 font-medium w-10">#</th>
                  <th className="px-4 py-3 font-medium">分组</th>
                  <th className="px-4 py-3 font-medium">用户输入</th>
                  <th className="px-4 py-3 font-medium">期望 Skill</th>
                  <th className="px-4 py-3 font-medium">期望 Intent</th>
                  <th className="px-4 py-3 font-medium w-40">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tc, idx) => (
                  <tr key={tc.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {tc.group}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-[250px] truncate">{tc.userMessage}</td>
                    <td className="px-4 py-3 text-gray-600">{tc.expected.skill ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{tc.expected.intent}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditTarget(tc)}
                          className="p-1.5 text-gray-400 hover:text-blue-600"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSingleRun(tc)}
                          disabled={runningId === tc.id}
                          className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-50"
                          title="执行"
                        >
                          {runningId === tc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        {tc.id in singleResults && (
                          singleResults[tc.id] ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {editTarget !== undefined && (
        <TestCaseForm
          testCase={editTarget}
          onSave={handleSave}
          onClose={() => setEditTarget(undefined)}
        />
      )}
    </div>
  );
}
