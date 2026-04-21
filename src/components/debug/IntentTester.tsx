import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { testIntent } from '../../api/debug';
import type { IntentTestResponse } from '../../types/debug';

const PROJECTS = [
  { value: '', label: '无' },
  { value: 'zhongchuan', label: '中船' },
  { value: 'guanwang', label: '管网' },
  { value: 'guowang', label: '国网' },
];

export default function IntentTester() {
  const [userMessage, setUserMessage] = useState('');
  const [projectId, setProjectId] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentTestResponse | null>(null);
  const [rawExpanded, setRawExpanded] = useState(false);

  function addHistory() {
    setHistory((h) => [...h, { role: 'user', content: '' }]);
  }

  function removeHistory(idx: number) {
    setHistory((h) => h.filter((_, i) => i !== idx));
  }

  function updateHistory(idx: number, field: 'role' | 'content', value: string) {
    setHistory((h) => h.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  async function handleTest() {
    if (!userMessage.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await testIntent({
        userMessage,
        projectId: projectId || undefined,
        conversationHistory: history.length > 0 ? history : undefined,
      });
      setResult(res);
    } catch {
      alert('测试执行失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }

  function confidenceColor(c: number) {
    if (c >= 0.8) return 'bg-green-500';
    if (c >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">用户消息</label>
          <textarea
            rows={4}
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="输入要测试的用户消息..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">项目上下文</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">对话历史</label>
            <button
              onClick={addHistory}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>
          {history.length === 0 && (
            <p className="text-sm text-gray-400">暂无对话历史</p>
          )}
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <select
                  value={h.role}
                  onChange={(e) => updateHistory(idx, 'role', e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm shrink-0"
                >
                  <option value="user">user</option>
                  <option value="assistant">assistant</option>
                </select>
                <input
                  value={h.content}
                  onChange={(e) => updateHistory(idx, 'content', e.target.value)}
                  placeholder="消息内容"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeHistory(idx)}
                  className="p-1.5 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={loading || !userMessage.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          执行测试
        </button>
      </div>

      {/* Right: Result */}
      <div>
        {loading && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            正在执行测试...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Skill:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {result.result.skill ?? '无'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Intent:</span>
              <span className="text-sm font-medium text-gray-900">{result.result.intent}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500">Confidence:</span>
                <span className="text-sm font-medium">{(result.result.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${confidenceColor(result.result.confidence)}`}
                  style={{ width: `${result.result.confidence * 100}%` }}
                />
              </div>
            </div>

            {Object.keys(result.result.apiParams).length > 0 && (
              <div>
                <span className="text-sm text-gray-500 block mb-1">API 参数:</span>
                <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                  <tbody>
                    {Object.entries(result.result.apiParams).map(([key, val]) => (
                      <tr key={key} className="border-b border-gray-50">
                        <td className="px-3 py-1.5 font-medium text-gray-600 bg-gray-50 w-1/3">{key}</td>
                        <td className="px-3 py-1.5 text-gray-800">{JSON.stringify(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Token 消耗: </span>
                <span className="text-gray-800">
                  输入 {result.tokenUsage.input} / 输出 {result.tokenUsage.output} / 费用 ¥{result.tokenUsage.cost.toFixed(4)}
                </span>
              </div>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">耗时: </span>
              <span className="text-gray-800">{result.latencyMs} ms</span>
            </div>

            <div>
              <button
                onClick={() => setRawExpanded((e) => !e)}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                {rawExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                LLM 原始输出
              </button>
              {rawExpanded && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <Editor
                    height="240px"
                    language="json"
                    value={result.rawLlmOutput}
                    options={{ readOnly: true, minimap: { enabled: false }, lineNumbers: 'off', scrollBeyondLastLine: false, fontSize: 12 }}
                    theme="vs-dark"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
