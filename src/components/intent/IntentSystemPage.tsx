/**
 * 意图/路由配置 - OpenClaw 风格
 * 意图由 Skill 的 description 隐式定义，此处配置：系统 Prompt、多轮规则、意图切换、迭代记录
 */
import { useState, useEffect } from 'react';
import {
  Loader2,
  Save,
  FileText,
  RefreshCw,
  MessageCircle,
  ArrowRightLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { getIntentSystem, updateIntentSystem, addIntentIteration } from '../../api/intentSystem';
import type {
  MultiTurnRule,
  IntentSwitchRule,
  IntentIteration,
} from '../../api/intentSystem';

type TabId = 'prompt' | 'multiTurn' | 'switch' | 'iterations';

export default function IntentSystemPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getIntentSystem>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('prompt');

  useEffect(() => {
    getIntentSystem()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(partial: Record<string, unknown>) {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await updateIntentSystem(partial);
      setData(updated);
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddIteration() {
    setSaving(true);
    try {
      const updated = await addIntentIteration({
        promptSnapshot: `迭代 v${(data?.iterations?.length ?? 0) + 1}`,
        metrics: { accuracy: 0, latencyMs: 0 },
      });
      setData(updated);
    } catch {
      alert('添加失败');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中...
      </div>
    );
  }

  const multiTurnRules = data.multiTurnRules || [];
  const intentSwitchRules = data.intentSwitchRules || [];
  const iterations = data.iterations || [];

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'prompt', label: '系统 Prompt', icon: <FileText className="w-4 h-4" /> },
    { id: 'multiTurn', label: '多轮对话', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'switch', label: '意图切换', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'iterations', label: '迭代优化', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Skill 路由与 Prompt</h1>
        <p className="text-sm text-gray-500 mt-1">
          OpenClaw 风格：意图由 Skill 的 description 隐式定义。此处配置系统 Prompt、多轮追问、意图切换规则。
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? 'bg-white border border-b-0 border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === 'prompt' && (
          <SystemPromptEditor
            systemPrompt={data.systemPrompt}
            onSave={(systemPrompt) => handleSave({ systemPrompt })}
            saving={saving}
          />
        )}
        {activeTab === 'multiTurn' && (
          <MultiTurnEditor
            rules={multiTurnRules}
            onSave={(multiTurnRules) => handleSave({ multiTurnRules })}
            saving={saving}
          />
        )}
        {activeTab === 'switch' && (
          <IntentSwitchEditor
            rules={intentSwitchRules}
            onSave={(intentSwitchRules) => handleSave({ intentSwitchRules })}
            saving={saving}
          />
        )}
        {activeTab === 'iterations' && (
          <IterationsEditor
            iterations={iterations}
            onAdd={handleAddIteration}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function SystemPromptEditor({
  systemPrompt,
  onSave,
  saving,
}: {
  systemPrompt: string;
  onSave: (s: string) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(systemPrompt);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        系统 Prompt 会与 Skill 列表（description + instructions）一起注入 LLM，LLM 根据描述隐式判断调用哪个工具。
      </p>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        rows={10}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
        placeholder="你是咸亨小仙 AI 助理..."
      />
      <button
        onClick={() => onSave(local)}
        disabled={saving}
        className="inline-flex items-center gap-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        保存
      </button>
    </div>
  );
}

function MultiTurnEditor({
  rules,
  onSave,
  saving,
}: {
  rules: MultiTurnRule[];
  onSave: (rules: MultiTurnRule[]) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(rules);

  function add() {
    setLocal((l) => [
      ...l,
      { id: `mt-${Date.now()}`, condition: '', action: 'clarify', suggestedQuestion: '' },
    ]);
  }

  function remove(idx: number) {
    setLocal((l) => l.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: keyof MultiTurnRule, value: string) {
    setLocal((l) =>
      l.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">多轮对话规则</h3>
        <div className="flex gap-2">
          <button onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
            <Plus className="w-4 h-4" /> 新增
          </button>
          <button
            onClick={() => onSave(local)}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {local.map((r, idx) => (
          <div key={r.id} className="p-4 border border-gray-200 rounded-lg space-y-2">
            <div className="flex justify-between">
              <input
                value={r.condition}
                onChange={(e) => update(idx, 'condition', e.target.value)}
                placeholder="触发条件"
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => remove(idx)} className="text-red-500 ml-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              value={r.suggestedQuestion || ''}
              onChange={(e) => update(idx, 'suggestedQuestion', e.target.value)}
              placeholder="建议追问"
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function IntentSwitchEditor({
  rules,
  onSave,
  saving,
}: {
  rules: IntentSwitchRule[];
  onSave: (rules: IntentSwitchRule[]) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(rules);

  function add() {
    setLocal((l) => [
      ...l,
      { id: `sw-${Date.now()}`, triggerKeywords: [], action: 'reset_context', description: '' },
    ]);
  }

  function remove(idx: number) {
    setLocal((l) => l.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: keyof IntentSwitchRule, value: unknown) {
    setLocal((l) =>
      l.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">意图切换规则</h3>
        <div className="flex gap-2">
          <button onClick={add} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
            <Plus className="w-4 h-4" /> 新增
          </button>
          <button
            onClick={() => onSave(local)}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {local.map((r, idx) => (
          <div key={r.id} className="p-4 border border-gray-200 rounded-lg space-y-2">
            <div className="flex justify-between">
              <input
                value={(r.triggerKeywords || []).join(', ')}
                onChange={(e) =>
                  update(
                    idx,
                    'triggerKeywords',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="触发关键词（逗号分隔）"
                className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => remove(idx)} className="text-red-500 ml-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              value={r.description}
              onChange={(e) => update(idx, 'description', e.target.value)}
              placeholder="规则描述"
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function IterationsEditor({
  iterations,
  onAdd,
  saving,
}: {
  iterations: IntentIteration[];
  onAdd: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">迭代历史</h3>
        <button
          onClick={onAdd}
          disabled={saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> 记录迭代
        </button>
      </div>
      <div className="space-y-2">
        {iterations.length === 0 && <p className="text-sm text-gray-400">暂无迭代记录</p>}
        {iterations.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <span className="font-medium">{it.promptSnapshot}</span>
              <span className="text-gray-500 text-sm ml-2">{new Date(it.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-600">
              {Object.entries(it.metrics || {}).map(([k, v]) => (
                <span key={k} className="mr-3">
                  {k}: {typeof v === 'number' ? v.toFixed(2) : v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
