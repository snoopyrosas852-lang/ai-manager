import { useState } from 'react';
import { ChevronDown, ChevronRight, FileCode2, Cpu, Zap, ArrowRightLeft, FolderOpen, Clock } from 'lucide-react';
import type { DebugInfo } from '../../types/session';

interface DebugPanelProps {
  debug: DebugInfo | null;
  messageId?: string;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function KVTable({ data }: { data: Record<string, any> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-xs text-gray-400">无</p>;
  }
  return (
    <table className="w-full text-xs">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="border-b border-gray-50 last:border-b-0">
            <td className="py-1 pr-3 font-medium text-gray-500 whitespace-nowrap">{k}</td>
            <td className="py-1 text-gray-700 break-all">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function DebugPanel({ debug, messageId }: DebugPanelProps) {
  const [rawExpanded, setRawExpanded] = useState(false);

  if (!debug) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center text-sm text-gray-400">
          <FileCode2 className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p>点击一条 AI 消息查看调试信息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 text-sm">
      {messageId && (
        <p className="mb-3 truncate text-xs text-gray-400">消息 ID: {messageId}</p>
      )}

      <Section title="意图识别" icon={Cpu}>
        <div className="space-y-2">
          {debug.skill && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {debug.skill}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">意图:</span>
            <span className="text-gray-800">{debug.intent}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">置信度</span>
            <ConfidenceBar value={debug.confidence} />
          </div>
        </div>
      </Section>

      <Section title="参数提取" icon={Zap}>
        <KVTable data={debug.extractedParams} />
      </Section>

      <Section title="API 参数" icon={ArrowRightLeft}>
        <KVTable data={debug.apiParams} />
      </Section>

      {debug.queryRewrite && (
        <Section title="Query 改写" icon={ArrowRightLeft}>
          <div className="space-y-1 text-xs">
            <p className="text-gray-500">原始 → 改写:</p>
            <p className="rounded bg-gray-50 px-2 py-1 text-gray-700">{debug.queryRewrite}</p>
          </div>
        </Section>
      )}

      {debug.projectId && (
        <Section title="项目" icon={FolderOpen}>
          <p className="text-xs text-gray-700">{debug.projectId}</p>
        </Section>
      )}

      <Section title="性能" icon={Clock}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <span className="text-gray-500">模型</span>
          <span className="text-gray-800">{debug.modelUsed}</span>
          <span className="text-gray-500">输入 Token</span>
          <span className="text-gray-800">{debug.inputTokens.toLocaleString()}</span>
          <span className="text-gray-500">输出 Token</span>
          <span className="text-gray-800">{debug.outputTokens.toLocaleString()}</span>
          <span className="text-gray-500">费用</span>
          <span className="text-gray-800">¥{debug.costYuan.toFixed(4)}</span>
          <span className="text-gray-500">TTFT</span>
          <span className="text-gray-800">{debug.ttftMs}ms</span>
          <span className="text-gray-500">总耗时</span>
          <span className="text-gray-800">{debug.totalMs}ms</span>
        </div>
      </Section>

      {(debug.rawLlmOutput || (debug as any).rawApiResponse) && (
        <div className="border-b border-gray-100 py-3">
          <button
            onClick={() => setRawExpanded(!rawExpanded)}
            className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
          >
            {rawExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            原始数据
          </button>
          {rawExpanded && (
            <div className="mt-2 space-y-2">
              {debug.rawLlmOutput && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">LLM 原始输出</p>
                  <pre className="max-h-40 overflow-auto rounded bg-gray-900 p-2 text-xs text-green-400">
                    {debug.rawLlmOutput}
                  </pre>
                </div>
              )}
              {(debug as any).rawApiResponse && (
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">OMS API 原始返参</p>
                  <pre className="max-h-40 overflow-auto rounded bg-gray-900 p-2 text-xs text-amber-400">
                    {JSON.stringify((debug as any).rawApiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
