import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { testRewrite } from '../../api/debug';
import type { RewriteTestResponse } from '../../types/debug';

export default function RewriteTester() {
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteTestResponse | null>(null);

  async function handleTest() {
    if (!userMessage.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await testRewrite({ userMessage });
      setResult(res);
    } catch {
      alert('测试执行失败，请检查后端服务');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">用户原始消息</label>
        <textarea
          rows={3}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="输入用户原始消息..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleTest}
          disabled={loading || !userMessage.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          执行
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          正在执行...
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Diff View */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">改写前</h4>
              <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-gray-800 min-h-[80px] whitespace-pre-wrap">
                {result.original}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">改写后</h4>
              <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-sm text-gray-800 min-h-[80px] whitespace-pre-wrap">
                {result.rewritten}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">识别项目:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {result.projectId ?? '未识别'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">需要澄清:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  result.needsClarification
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {result.needsClarification ? '是' : '否'}
              </span>
            </div>

            <div className="text-sm">
              <span className="text-gray-500">耗时: </span>
              <span className="text-gray-800">{result.latencyMs} ms</span>
            </div>
          </div>

          {result.needsClarification && result.clarificationQuestion && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <span className="font-medium">澄清问题: </span>
              {result.clarificationQuestion}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
