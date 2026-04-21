/**
 * QA 知识库：问答策略、评估体系、数据评测集、模型效果评估
 */
import { useState, useEffect } from 'react';
import {
  Loader2,
  Save,
  Settings,
  BarChart3,
  Database,
  TrendingUp,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getQAKnowledge,
  updateQAKnowledge,
  addEvalDataset,
  addEvalItem,
  addModelEvaluation,
} from '../../api/qaKnowledge';
import type {
  QAStrategy,
  EvaluationSystem,
  EvalDataset,
  EvalItem,
  ModelEvaluation,
} from '../../api/qaKnowledge';

type TabId = 'strategy' | 'evaluation' | 'datasets' | 'modelEval';

export default function QAKnowledgePage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getQAKnowledge>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('strategy');

  useEffect(() => {
    getQAKnowledge()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(partial: Record<string, unknown>) {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await updateQAKnowledge(partial);
      setData(updated);
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDataset() {
    const name = prompt('评测集名称');
    if (!name) return;
    setSaving(true);
    try {
      const ds = await addEvalDataset({ name, description: '' });
      setData((d) =>
        d ? { ...d, evalDatasets: [...(d.evalDatasets || []), ds] } : null
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
    { id: 'strategy', label: '问答策略', icon: <Settings className="w-4 h-4" /> },
    { id: 'evaluation', label: '评估体系', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'datasets', label: '数据评测集', icon: <Database className="w-4 h-4" /> },
    { id: 'modelEval', label: '模型效果评估', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">QA 知识库问答</h1>
        <p className="text-sm text-gray-500 mt-1">
          问答策略、评估体系、数据评测集构建、模型效果评估
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
        {activeTab === 'strategy' && (
          <QAStrategyEditor
            strategy={data.qaStrategy}
            onSave={(qaStrategy) => handleSave({ qaStrategy })}
            saving={saving}
          />
        )}
        {activeTab === 'evaluation' && (
          <EvaluationEditor
            system={data.evaluationSystem}
            onSave={(evaluationSystem) => handleSave({ evaluationSystem })}
            saving={saving}
          />
        )}
        {activeTab === 'datasets' && (
          <DatasetsEditor
            datasets={data.evalDatasets}
            items={data.evalItems}
            onSave={handleSave}
            onAddDataset={handleAddDataset}
            onAddEvalItem={async (payload) => {
              const item = await addEvalItem(payload);
              setData((d) =>
                d
                  ? {
                      ...d,
                      evalItems: [...(d.evalItems || []), item],
                      evalDatasets: d.evalDatasets.map((x) =>
                        x.id === payload.datasetId
                          ? { ...x, itemCount: (x.itemCount || 0) + 1 }
                          : x
                      ),
                    }
                  : null
              );
            }}
            saving={saving}
          />
        )}
        {activeTab === 'modelEval' && (
          <ModelEvalEditor
            evaluations={data.modelEvaluations}
            datasets={data.evalDatasets}
            onAddEval={async (payload) => {
              const ev = await addModelEvaluation(payload);
              setData((d) =>
                d
                  ? {
                      ...d,
                      modelEvaluations: [...(d.modelEvaluations || []), ev],
                    }
                  : null
              );
            }}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function QAStrategyEditor({
  strategy,
  onSave,
  saving,
}: {
  strategy: QAStrategy;
  onSave: (s: QAStrategy) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(strategy);

  return (
    <div className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">检索 Top-K</label>
          <input
            type="number"
            value={local.retrievalTopK}
            onChange={(e) =>
              setLocal((l) => ({ ...l, retrievalTopK: parseInt(e.target.value) || 5 }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">相似度阈值</label>
          <input
            type="number"
            step="0.1"
            value={local.similarityThreshold}
            onChange={(e) =>
              setLocal((l) => ({
                ...l,
                similarityThreshold: parseFloat(e.target.value) || 0.7,
              }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分块大小</label>
          <input
            type="number"
            value={local.chunkSize}
            onChange={(e) =>
              setLocal((l) => ({ ...l, chunkSize: parseInt(e.target.value) || 500 }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">重叠长度</label>
          <input
            type="number"
            value={local.overlap}
            onChange={(e) =>
              setLocal((l) => ({ ...l, overlap: parseInt(e.target.value) || 50 }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={local.rerankEnabled}
            onChange={(e) => setLocal((l) => ({ ...l, rerankEnabled: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <span className="text-sm">启用 Rerank</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={local.fallbackToGenerate}
            onChange={(e) =>
              setLocal((l) => ({ ...l, fallbackToGenerate: e.target.checked }))
            }
            className="rounded border-gray-300"
          />
          <span className="text-sm">无匹配时生成回答</span>
        </label>
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

function EvaluationEditor({
  system,
  onSave,
  saving,
}: {
  system: EvaluationSystem;
  onSave: (s: EvaluationSystem) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(system);

  return (
    <div className="space-y-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">准确率权重</label>
          <input
            type="number"
            step="0.1"
            value={local.accuracyWeight}
            onChange={(e) =>
              setLocal((l) => ({
                ...l,
                accuracyWeight: parseFloat(e.target.value) || 0.4,
              }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">相关性权重</label>
          <input
            type="number"
            step="0.1"
            value={local.relevanceWeight}
            onChange={(e) =>
              setLocal((l) => ({
                ...l,
                relevanceWeight: parseFloat(e.target.value) || 0.3,
              }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">忠实度权重</label>
          <input
            type="number"
            step="0.1"
            value={local.faithfulnessWeight}
            onChange={(e) =>
              setLocal((l) => ({
                ...l,
                faithfulnessWeight: parseFloat(e.target.value) || 0.2,
              }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">延迟权重</label>
          <input
            type="number"
            step="0.1"
            value={local.latencyWeight}
            onChange={(e) =>
              setLocal((l) => ({
                ...l,
                latencyWeight: parseFloat(e.target.value) || 0.1,
              }))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      <p className="text-sm text-gray-500">
        评估指标：{local.metrics?.join(', ') || 'accuracy, relevance, faithfulness, latency'}
      </p>
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

function DatasetsEditor({
  datasets,
  items,
  onSave,
  onAddDataset,
  onAddEvalItem,
  saving,
}: {
  datasets: EvalDataset[];
  items: EvalItem[];
  onSave: (p: Record<string, unknown>) => void;
  onAddDataset: () => void;
  onAddEvalItem?: (p: { datasetId: string; question: string; expectedAnswer?: string }) => Promise<void>;
  saving: boolean;
}) {
  const [selectedDs, setSelectedDs] = useState<string | null>(datasets[0]?.id || null);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const dsItems = items.filter((i) => i.datasetId === selectedDs);

  async function handleAddItem() {
    if (!selectedDs || !newQ.trim()) return;
    await onAddEvalItem?.({ datasetId: selectedDs, question: newQ.trim(), expectedAnswer: newA.trim() });
    setNewQ('');
    setNewA('');
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">评测集</h3>
        <button
          onClick={onAddDataset}
          disabled={saving}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <Plus className="w-4 h-4" /> 新建评测集
        </button>
      </div>
      <div className="flex gap-4">
        <div className="w-48 border border-gray-200 rounded-lg p-2 space-y-1">
          {datasets.map((ds) => (
            <button
              key={ds.id}
              onClick={() => setSelectedDs(ds.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                selectedDs === ds.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              {ds.name} ({ds.itemCount ?? 0})
            </button>
          ))}
        </div>
        <div className="flex-1">
          {selectedDs && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                评测集「{datasets.find((d) => d.id === selectedDs)?.name}」共 {dsItems.length} 条
              </p>
              {onAddEvalItem && (
                <div className="flex gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <input
                    value={newQ}
                    onChange={(e) => setNewQ(e.target.value)}
                    placeholder="问题"
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                  <input
                    value={newA}
                    onChange={(e) => setNewA(e.target.value)}
                    placeholder="期望答案"
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                  <button
                    onClick={handleAddItem}
                    disabled={saving || !newQ.trim()}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              {dsItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-gray-200 rounded-lg text-sm"
                >
                  <div className="font-medium text-gray-700">Q: {item.question}</div>
                  <div className="text-gray-600 mt-1">A: {item.expectedAnswer}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModelEvalEditor({
  evaluations,
  datasets,
  onAddEval,
  saving,
}: {
  evaluations: ModelEvaluation[];
  datasets: EvalDataset[];
  onAddEval: (p: {
    datasetId: string;
    modelName: string;
    metrics?: Record<string, number>;
    totalCases?: number;
    passedCases?: number;
  }) => Promise<void>;
  saving: boolean;
}) {
  const [modelName, setModelName] = useState('');
  const [datasetId, setDatasetId] = useState(datasets[0]?.id || '');

  async function handleAdd() {
    if (!modelName.trim() || !datasetId) {
      alert('请填写模型名称并选择评测集');
      return;
    }
    await onAddEval({
      datasetId,
      modelName: modelName.trim(),
      metrics: { accuracy: 0, relevance: 0, faithfulness: 0, latencyMs: 0 },
      totalCases: 0,
      passedCases: 0,
    });
    setModelName('');
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">评测集</label>
          <select
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="如 gpt-4、claude-3"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> 记录评估
        </button>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">历史评估</h3>
        {evaluations.length === 0 && (
          <p className="text-sm text-gray-400">暂无模型评估记录</p>
        )}
        {evaluations.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div>
              <span className="font-medium">{ev.modelName}</span>
              <span className="text-gray-500 text-sm ml-2">
                {datasets.find((d) => d.id === ev.datasetId)?.name} ·{' '}
                {new Date(ev.runAt).toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              通过 {ev.passedCases}/{ev.totalCases} ·{' '}
              {Object.entries(ev.metrics || {}).map(([k, v]) => (
                <span key={k} className="mr-2">
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
