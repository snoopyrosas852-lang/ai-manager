import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2 } from 'lucide-react';
import { testSummary } from '../../api/debug';
import type { SummaryTestResponse } from '../../types/debug';

const SKILLS = [
  'query_contract',
  'query_payment',
  'query_delivery',
  'query_invoice',
  'query_project',
];

const PROJECTS = [
  { value: '', label: '无' },
  { value: 'zhongchuan', label: '中船' },
  { value: 'guanwang', label: '管网' },
  { value: 'guowang', label: '国网' },
];

export default function SummaryTester() {
  const [skill, setSkill] = useState(SKILLS[0]);
  const [projectId, setProjectId] = useState('');
  const [apiJson, setApiJson] = useState('{\n  \n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryTestResponse | null>(null);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    try {
      const res = await testSummary({
        skill,
        apiResponseJson: apiJson,
        projectId: projectId || undefined,
      });
      setResult(res);
    } catch {
      alert('测试执行失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SKILLS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目上下文</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">OMS API JSON 响应</label>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <Editor
              height="400px"
              language="json"
              value={apiJson}
              onChange={(v) => setApiJson(v ?? '')}
              options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, tabSize: 2 }}
              theme="vs-dark"
            />
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          生成摘要
        </button>
      </div>

      {/* Right: Result */}
      <div>
        {loading && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            正在生成摘要...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h4 className="text-sm font-medium text-gray-500 mb-3">生成摘要</h4>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {result.summary}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
              <div className="text-sm">
                <span className="text-gray-500">Token 消耗: </span>
                <span className="text-gray-800">
                  输入 {result.tokenUsage.input} / 输出 {result.tokenUsage.output} / 费用 ¥{result.tokenUsage.cost.toFixed(4)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">耗时: </span>
                <span className="text-gray-800">{result.latencyMs} ms</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
