/**
 * Agent 配置：Plan、Action、能力评估
 */
import { useState, useEffect } from 'react';
import {
  Loader2,
  Save,
  ListTree,
  Zap,
  BarChart3,
  Plus,
  Trash2,
} from 'lucide-react';
import { getAgentConfig, updateAgentConfig, addAgentEvalRun } from '../../api/agentConfig';
import type {
  PlanConfig,
  ActionConfig,
  CapabilityEvaluation,
} from '../../api/agentConfig';

type TabId = 'plan' | 'action' | 'capability';

export default function AgentConfigPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAgentConfig>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('plan');

  useEffect(() => {
    getAgentConfig()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(partial: Record<string, unknown>) {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await updateAgentConfig(partial);
      setData(updated);
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvalRun() {
    const caps = data?.capabilityEvaluations || [];
    const scores: Record<string, number> = {};
    caps.forEach((c) => {
      scores[c.id] = c.lastScore;
    });
    setSaving(true);
    try {
      const run = await addAgentEvalRun({ scores });
      setData((d) =>
        d ? { ...d, evalRuns: [...(d.evalRuns || []), run] } : null
      );
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

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'plan', label: 'Plan 任务分解', icon: <ListTree className="w-4 h-4" /> },
    { id: 'action', label: 'Action 执行配置', icon: <Zap className="w-4 h-4" /> },
    { id: 'capability', label: '能力评估', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agent 配置</h1>
        <p className="text-sm text-gray-500 mt-1">
          Plan 任务分解、Action 执行、Agent 能力评估
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
        {activeTab === 'plan' && (
          <PlanEditor
            config={data.planConfig}
            onSave={(planConfig) => handleSave({ planConfig })}
            saving={saving}
          />
        )}
        {activeTab === 'action' && (
          <ActionEditor
            config={data.actionConfig}
            onSave={(actionConfig) => handleSave({ actionConfig })}
            saving={saving}
          />
        )}
        {activeTab === 'capability' && (
          <CapabilityEditor
            capabilities={data.capabilityEvaluations}
            evalRuns={data.evalRuns}
            onSave={(capabilityEvaluations) => handleSave({ capabilityEvaluations })}
            onAddRun={handleAddEvalRun}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function PlanEditor({
  config,
  onSave,
  saving,
}: {
  config: PlanConfig;
  onSave: (c: PlanConfig) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(config);

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="planEnabled"
          checked={local.enabled}
          onChange={(e) => setLocal((l) => ({ ...l, enabled: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <label htmlFor="planEnabled" className="text-sm font-medium text-gray-700">
          启用 Plan 任务分解
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">最大步骤数</label>
        <input
          type="number"
          value={local.maxSteps}
          onChange={(e) =>
            setLocal((l) => ({ ...l, maxSteps: parseInt(e.target.value) || 10 }))
          }
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="allowParallel"
          checked={local.allowParallel}
          onChange={(e) => setLocal((l) => ({ ...l, allowParallel: e.target.checked }))}
          className="rounded border-gray-300"
        />
        <label htmlFor="allowParallel" className="text-sm font-medium text-gray-700">
          允许并行执行
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Prompt 模板</label>
        <textarea
          value={local.promptTemplate || ''}
          onChange={(e) => setLocal((l) => ({ ...l, promptTemplate: e.target.value }))}
          rows={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
          placeholder="将用户请求分解为可执行的步骤..."
        />
      </div>
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

function ActionEditor({
  config,
  onSave,
  saving,
}: {
  config: ActionConfig;
  onSave: (c: ActionConfig) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(config);

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="trackExecutions"
          checked={local.trackExecutions}
          onChange={(e) =>
            setLocal((l) => ({ ...l, trackExecutions: e.target.checked }))
          }
          className="rounded border-gray-300"
        />
        <label htmlFor="trackExecutions" className="text-sm font-medium text-gray-700">
          记录 Action 执行
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">超时时间 (ms)</label>
        <input
          type="number"
          value={local.timeoutMs}
          onChange={(e) =>
            setLocal((l) => ({ ...l, timeoutMs: parseInt(e.target.value) || 30000 }))
          }
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">重试次数</label>
        <input
          type="number"
          value={local.retryCount}
          onChange={(e) =>
            setLocal((l) => ({ ...l, retryCount: parseInt(e.target.value) || 2 }))
          }
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
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

function CapabilityEditor({
  capabilities,
  evalRuns,
  onSave,
  onAddRun,
  saving,
}: {
  capabilities: CapabilityEvaluation[];
  evalRuns: { id: string; runAt: string; scores: Record<string, number> }[];
  onSave: (c: CapabilityEvaluation[]) => void;
  onAddRun: () => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(capabilities);

  function add() {
    setLocal((l) => [
      ...l,
      {
        id: `cap-${Date.now()}`,
        name: '',
        description: '',
        metric: '',
        weight: 0.3,
        lastScore: 0,
      },
    ]);
  }

  function remove(idx: number) {
    setLocal((l) => l.filter((_, i) => i !== idx));
  }

  function update(idx: number, field: keyof CapabilityEvaluation, value: unknown) {
    setLocal((l) =>
      l.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">能力维度</h3>
        <div className="flex gap-2">
          <button
            onClick={add}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
          >
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
          <button
            onClick={onAddRun}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            记录评估
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {local.map((cap, idx) => (
          <div
            key={cap.id}
            className="p-4 border border-gray-200 rounded-lg grid grid-cols-5 gap-4 items-center"
          >
            <input
              value={cap.name}
              onChange={(e) => update(idx, 'name', e.target.value)}
              placeholder="能力名称"
              className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm"
            />
            <input
              value={cap.description}
              onChange={(e) => update(idx, 'description', e.target.value)}
              placeholder="描述"
              className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={cap.weight}
                onChange={(e) =>
                  update(idx, 'weight', parseFloat(e.target.value) || 0)
                }
                className="w-16 border border-gray-200 rounded px-2 py-1 text-sm"
                placeholder="权重"
              />
              <span className="text-sm text-gray-500">权重</span>
            </div>
            <input
              value={cap.metric}
              onChange={(e) => update(idx, 'metric', e.target.value)}
              placeholder="指标名"
              className="col-span-2 border border-gray-200 rounded px-2 py-1 text-sm"
            />
            <div className="col-span-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">上次得分:</span>
              <span className="font-medium">{cap.lastScore.toFixed(2)}</span>
            </div>
            <button onClick={() => remove(idx)} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">评估历史</h4>
        {evalRuns.length === 0 && (
          <p className="text-sm text-gray-400">暂无评估记录</p>
        )}
        {evalRuns.slice(0, 10).map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 text-sm"
          >
            <span className="text-gray-500">
              {new Date(run.runAt).toLocaleString()}
            </span>
            <div className="flex gap-4">
              {Object.entries(run.scores || {}).map(([k, v]) => (
                <span key={k}>
                  {k}: {(v as number).toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
