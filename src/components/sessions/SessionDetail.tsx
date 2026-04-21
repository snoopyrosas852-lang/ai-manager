import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bot, ThumbsDown, PackageSearch, FileText, BarChart3 } from 'lucide-react';
import { getSessionDetail } from '../../api/sessions';
import type { SessionDetail as SessionDetailType, SessionMessage, DebugInfo } from '../../types/session';
import DebugPanel from './DebugPanel';

function formatDate(s: string) {
  return new Date(s).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CardPreview({ msgType, cardData }: { msgType: string; cardData: any }) {
  if (!cardData) return null;
  if (msgType === 'order_list') {
    const orders = cardData.orders ?? [];
    const total = cardData.pagination?.totalCount ?? orders.length;
    const variant = cardData.variant ?? 'default';
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <PackageSearch className="h-3.5 w-3.5" />
          <span>订单列表 ({total} 笔)</span>
          {variant !== 'default' && (
            <span className="rounded bg-slate-200 px-1.5 py-0.5">{variant}</span>
          )}
        </div>
      </div>
    );
  }
  if (msgType === 'order_detail') {
    const items = cardData.items ?? [];
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <FileText className="h-3.5 w-3.5" />
          <span>商品明细 ({cardData.orderNo}) · {items.length} 行</span>
        </div>
      </div>
    );
  }
  if (msgType === 'order_summary') {
    const d = cardData;
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>汇总: {d.totalOrders ?? 0} 笔 · ¥{(d.totalAmount ?? 0).toLocaleString()} · 红线 {d.redlineCount ?? 0}</span>
        </div>
      </div>
    );
  }
  return null;
}

function MessageBubble({
  msg,
  isSelected,
  onSelect,
}: {
  msg: SessionMessage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isUser = msg.role === 'user';
  const hasNegativeFeedback = msg.feedback?.rating === 'down';
  const debug = msg.debug;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        onClick={!isUser ? onSelect : undefined}
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white'
            : `bg-white shadow-sm border ${
                isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
              } text-gray-800 cursor-pointer hover:border-blue-300 transition-colors`
        }`}
      >
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          {isUser ? (
            <User className="h-3.5 w-3.5 opacity-70" />
          ) : (
            <Bot className="h-3.5 w-3.5 text-gray-400" />
          )}
          <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
            {formatDate(msg.createdAt)}
          </span>
          {hasNegativeFeedback && (
            <span className="flex items-center gap-0.5 text-xs text-red-500">
              <ThumbsDown className="h-3 w-3" />
            </span>
          )}
        </div>

        <div className="whitespace-pre-wrap break-words">{msg.content}</div>

        {!isUser && msg.msgType && msg.cardData && (
          <CardPreview msgType={msg.msgType} cardData={msg.cardData} />
        )}

        {!isUser && debug && (
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-400 border-t border-gray-100 pt-2">
            <span>Token: {(debug.inputTokens ?? 0) + (debug.outputTokens ?? 0)}</span>
            <span>TTFT: {debug.ttftMs ?? '-'}ms</span>
            <span>总耗时: {debug.totalMs ?? '-'}ms</span>
            <span>费用: ¥{(debug.costYuan ?? 0).toFixed(4)}</span>
          </div>
        )}

        {hasNegativeFeedback && !isUser && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        )}
      </div>
    </div>
  );
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<SessionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [selectedDebug, setSelectedDebug] = useState<DebugInfo | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSessionDetail(id)
      .then(setData)
      .catch((err) => console.error('Failed to fetch session detail', err))
      .finally(() => setLoading(false));
  }, [id]);

  function handleSelectMessage(msg: SessionMessage) {
    setSelectedMsgId(msg.id);
    setSelectedDebug(msg.debug ?? null);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <p className="text-gray-400">未找到该会话</p>
        <button
          onClick={() => navigate('/sessions')}
          className="text-sm text-blue-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    );
  }

  const { session, messages } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/sessions')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">会话详情</h2>
      </div>

      {/* Meta Bar */}
      <div className="flex flex-wrap gap-4 rounded-xl bg-white px-5 py-3 shadow-sm text-sm text-gray-600">
        <span>
          <span className="text-gray-400">用户: </span>
          <span className="font-medium text-gray-900">{session.userName}</span>
        </span>
        <span>
          <span className="text-gray-400">标题: </span>
          <span className="font-medium text-gray-900">{session.title}</span>
        </span>
        <span>
          <span className="text-gray-400">Token: </span>
          {session.totalTokens.toLocaleString()}
        </span>
        <span>
          <span className="text-gray-400">费用: </span>
          ¥{session.totalCost.toFixed(2)}
        </span>
        <span>
          <span className="text-gray-400">时间: </span>
          {formatDate(session.createdAt)}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
        {/* Left: Conversation */}
        <div className="rounded-xl bg-gray-50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-500">对话回放</h3>
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isSelected={selectedMsgId === msg.id}
                onSelect={() => handleSelectMessage(msg)}
              />
            ))}
          </div>
        </div>

        {/* Right: Debug Panel */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 min-h-[400px]">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-500">调试信息</h3>
          </div>
          <DebugPanel debug={selectedDebug} messageId={selectedMsgId ?? undefined} />
        </div>
      </div>
    </div>
  );
}
