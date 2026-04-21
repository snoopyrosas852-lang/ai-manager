/**
 * V1.0.2 受管文档与向量 — OSS/FastGPT 说明占位、列表、上传、同步重试（与「对话 QA 知识库」区分）
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Upload, Database, Cloud } from 'lucide-react';
import type { CorpusType, ManagedFileItem, ManagedSettings } from '../../api/managedCorpus';
import {
  managedGetSettings,
  managedPutSettings,
  managedListFiles,
  managedUploadFile,
  managedRetryVector,
} from '../../api/managedCorpus';

const TYPE_LABEL: Record<CorpusType, string> = {
  prd: '产品需求文档',
  tender: '招投标',
  catalog: '采购图册',
};

const STATUS_LABEL: Record<string, string> = {
  queued: '排队',
  syncing: '同步中',
  success: '已同步',
  failed: '失败',
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ManagedCorpusPage() {
  const [settings, setSettings] = useState<ManagedSettings | null>(null);
  const [items, setItems] = useState<ManagedFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('');
  const [qDraft, setQDraft] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [corpusType, setCorpusType] = useState<CorpusType>('prd');
  const [savingSettings, setSavingSettings] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [st, list] = await Promise.all([
        managedGetSettings(),
        managedListFiles({
          type: filterType || undefined,
          q: appliedQ.trim() || undefined,
        }),
      ]);
      setSettings(st);
      setItems(list.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, appliedQ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const next = await managedPutSettings({
        ossBucketNote: settings.ossBucketNote,
        fastgptAppIdNote: settings.fastgptAppIdNote,
      });
      setSettings(next);
      alert('已保存说明（真实密钥仅服务端配置，见部署文档）');
    } finally {
      setSavingSettings(false);
    }
  }

  async function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const data = r.result as string;
        const i = data.indexOf(',');
        resolve(i >= 0 ? data.slice(i + 1) : data);
      };
      r.onerror = () => reject(new Error('read'));
      r.readAsDataURL(f);
    });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const b64 = await fileToBase64(f);
      await managedUploadFile({
        corpusType,
        name: f.name,
        mime: f.type || 'application/octet-stream',
        base64: b64,
      });
    }
    e.target.value = '';
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">受管文档与向量</h1>
        <p className="text-sm text-slate-500 mt-1">
          对应小仙 PRD V1.0.2 模块 B：PRD / 招投标 / 采购图册；与左侧菜单「对话 QA 知识库（JSON）」为不同能力。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Cloud className="w-4 h-4" />
            OSS（说明占位）
          </div>
          {settings && (
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[72px]"
              placeholder="桶名、前缀、生命周期策略等（不落真实 AK/SK）"
              value={settings.ossBucketNote ?? ''}
              onChange={(e) => setSettings({ ...settings, ossBucketNote: e.target.value })}
            />
          )}
        </div>
        <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Database className="w-4 h-4" />
            FastGPT（说明占位）
          </div>
          {settings && (
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[72px]"
              placeholder="应用 ID、知识库 ID、回调地址等"
              value={settings.fastgptAppIdNote ?? ''}
              onChange={(e) => setSettings({ ...settings, fastgptAppIdNote: e.target.value })}
            />
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={savingSettings || !settings}
        onClick={saveSettings}
        className="px-4 py-2 rounded-lg bg-[#a31515] text-white text-sm hover:bg-[#8c1212] disabled:opacity-50"
      >
        {savingSettings ? '保存中…' : '保存 OSS / FastGPT 说明'}
      </button>

      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">受管文件列表</span>
          <select
            className="text-sm border rounded-lg px-2 py-1.5"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="prd">PRD</option>
            <option value="tender">招投标</option>
            <option value="catalog">采购图册</option>
          </select>
          <input
            type="search"
            placeholder="文件名"
            className="text-sm border rounded-lg px-3 py-1.5 flex-1 min-w-[120px] max-w-xs"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
          />
          <button
            type="button"
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={() => {
              setAppliedQ(qDraft);
            }}
          >
            查询
          </button>
          <select
            className="text-sm border rounded-lg px-2 py-1.5"
            value={corpusType}
            onChange={(e) => setCorpusType(e.target.value as CorpusType)}
          >
            <option value="prd">上传为：PRD</option>
            <option value="tender">上传为：招投标</option>
            <option value="catalog">上传为：采购图册</option>
          </select>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm cursor-pointer hover:bg-blue-700">
            <Upload className="w-4 h-4" />
            上传
            <input type="file" className="hidden" multiple onChange={onUpload} />
          </label>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">文件名</th>
                  <th className="px-4 py-2 font-medium w-28">类型</th>
                  <th className="px-4 py-2 font-medium w-24">同步</th>
                  <th className="px-4 py-2 font-medium w-36">更新时间</th>
                  <th className="px-4 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800 truncate max-w-[280px]" title={it.name}>
                        {it.name}
                      </div>
                      <div className="text-xs text-slate-400">{formatBytes(it.size)}</div>
                      {it.error && <div className="text-xs text-red-600 mt-0.5">{it.error}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{TYPE_LABEL[it.corpusType]}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          it.vectorStatus === 'success'
                            ? 'bg-emerald-50 text-emerald-800'
                            : it.vectorStatus === 'failed'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {STATUS_LABEL[it.vectorStatus] ?? it.vectorStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">
                      {it.updatedAt ? new Date(it.updatedAt).toLocaleString('zh-CN') : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="text-xs text-blue-600 inline-flex items-center gap-1"
                        onClick={async () => {
                          await managedRetryVector(it.id);
                          await refresh();
                        }}
                        title="重新进入同步队列（演示）"
                      >
                        <RefreshCw className="w-3 h-3" />
                        重试
                      </button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      暂无受管文件。上传后状态为排队 → 同步中 → 已同步（演示）。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
