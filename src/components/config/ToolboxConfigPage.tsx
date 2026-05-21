/**
 * 百宝箱配置 — 对齐 gateway 参考页：卡片编排、动作类型、保存与重新加载
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  LayoutGrid,
} from 'lucide-react';
import {
  getToolboxConfig,
  saveToolboxConfig,
  ACTION_KIND_OPTIONS,
} from '../../api/toolboxConfig';
import type {
  ToolboxCardConfig,
  ToolboxConfig,
  ToolboxActionConfig,
  ToolboxActionKind,
} from '../../types/toolboxConfig';

const accentBtn = 'bg-[#a31515] hover:bg-[#8f1212] focus-visible:ring-[#a31515]';

function formatTime(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('zh-CN');
  } catch {
    return '—';
  }
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ToolboxConfigPage() {
  const [config, setConfig] = useState<ToolboxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getToolboxConfig();
      setConfig(data);
    } catch {
      alert('加载百宝箱配置失败');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalActions = useMemo(() => {
    if (!config) return 0;
    return config.cards.reduce((acc, c) => acc + (c.actions?.length ?? 0), 0);
  }, [config]);

  async function persist(next: ToolboxConfig) {
    setSaving(true);
    try {
      const saved = await saveToolboxConfig(next);
      setConfig(saved);
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAll() {
    if (!config) return;
    await persist(config);
  }

  async function handleReload() {
    setReloading(true);
    try {
      await load();
    } finally {
      setReloading(false);
    }
  }

  function updateCard(id: string, patch: Partial<ToolboxCardConfig>) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      };
    });
  }

  function removeCard(id: string) {
    if (!confirm('确定删除该百宝箱卡片？')) return;
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, cards: prev.cards.filter((c) => c.id !== id) };
    });
  }

  function addCard() {
    const card: ToolboxCardConfig = {
      id: newId('card'),
      title: `新建百宝箱 ${Math.floor(Math.random() * 900) + 100}`,
      subtitle: '基础字段负责前台展示，动作列表决定点击后的真实执行方式。',
      enabled: true,
      favoritable: true,
      actions: [
        {
          id: newId('act'),
          name: '默认动作',
          kind: 'internal',
          notes: '',
        },
      ],
    };
    setConfig((prev) => (prev ? { ...prev, cards: [...prev.cards, card] } : prev));
  }

  function addAction(cardId: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      const action: ToolboxActionConfig = {
        id: newId('act'),
        name: '新动作',
        kind: 'internal',
        notes: '',
      };
      return {
        ...prev,
        cards: prev.cards.map((c) =>
          c.id === cardId ? { ...c, actions: [...(c.actions || []), action] } : c,
        ),
      };
    });
  }

  function updateAction(
    cardId: string,
    actionId: string,
    patch: Partial<ToolboxActionConfig>,
  ) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) => {
          if (c.id !== cardId) return c;
          return {
            ...c,
            actions: c.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
          };
        }),
      };
    });
  }

  function removeAction(cardId: string, actionId: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) => {
          if (c.id !== cardId) return c;
          return { ...c, actions: c.actions.filter((a) => a.id !== actionId) };
        }),
      };
    });
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> 加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">百宝箱工具编排</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-500">
          统一维护百宝箱卡片、动作类型与执行配置。当前页面以结构化表单为主；Python
          动作支持直传脚本，并优先从 <code className="rounded bg-gray-100 px-1 text-xs">.py</code> 或
          可识别入口脚本的 <code className="rounded bg-gray-100 px-1 text-xs">.zip</code>{' '}
          中读取入参与出参定义（接入执行器时生效）。
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-[#a31515]/15 bg-[#a31515]/[0.06] px-4 py-3 text-sm text-gray-700">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#a31515]" aria-hidden />
        <p>
          完成卡片标题、副文案与动作列表编辑后，使用「保存全部配置」写入服务端；保存成功后，可再接前台拉取接口供小仙百宝箱读取。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">当前模式</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {config.mode === 'published' ? '已发布' : '草稿（单一草稿）'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">版本标签</p>
          <p className="mt-2 inline-flex rounded-full border border-[#a31515]/25 bg-[#a31515]/10 px-3 py-1 text-sm font-medium text-[#7a1010]">
            {config.versionLabel || '唯一生效版本'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">草稿概览</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
            {config.cards.length}
            <span className="ml-1 text-base font-normal text-gray-500">个百宝箱</span>
            <span className="mx-2 text-gray-300">/</span>
            {totalActions}
            <span className="ml-1 text-base font-normal text-gray-500">个动作</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">最近更新时间：{formatTime(config.updatedAt)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleReload()}
          disabled={reloading || saving}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${reloading ? 'animate-spin' : ''}`} />
          重新加载
        </button>
        <button
          type="button"
          onClick={() => void handleSaveAll()}
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 ${accentBtn}`}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          保存配置
        </button>
        <button
          type="button"
          onClick={addCard}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          新增百宝箱
        </button>
      </div>

      <div className="space-y-4">
        {config.cards.map((card, index) => (
          <div
            key={card.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50/90 px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/90 to-[#a31515] text-white shadow">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    百宝箱 {index + 1}
                    <span className="ml-2 text-gray-400">
                      · 当前动作数：{card.actions?.length ?? 0}
                    </span>
                  </p>
                  <input
                    value={card.title}
                    onChange={(e) => updateCard(card.id, { title: e.target.value })}
                    className="mt-1 w-full max-w-xl border-0 bg-transparent text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                    placeholder="卡片标题"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={card.enabled}
                    onChange={(e) => updateCard(card.id, { enabled: e.target.checked })}
                    className="rounded border-gray-300 text-[#a31515] focus:ring-[#a31515]/40"
                  />
                  启用
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={card.favoritable}
                    onChange={(e) => updateCard(card.id, { favoritable: e.target.checked })}
                    className="rounded border-gray-300 text-[#a31515] focus:ring-[#a31515]/40"
                  />
                  支持收藏
                </label>
                <button
                  type="button"
                  onClick={() => removeCard(card.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  删除百宝箱
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">副标题 / 说明</label>
                <textarea
                  value={card.subtitle}
                  onChange={(e) => updateCard(card.id, { subtitle: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#a31515]/30"
                  placeholder="前台卡片下方展示；说明用途与边界。"
                />
                <p className="mt-1 text-xs text-gray-400">
                  基础字段负责前台展示，动作列表决定点击后的真实执行方式。
                </p>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800">动作列表</span>
                  <button
                    type="button"
                    onClick={() => addAction(card.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:border-[#a31515]/40 hover:text-[#a31515]"
                  >
                    <Plus className="h-3.5 w-3.5" /> 添加动作
                  </button>
                </div>
                <div className="space-y-2">
                  {(card.actions ?? []).map((act) => (
                    <div
                      key={act.id}
                      className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-[#fafbfc] p-3 sm:flex-row sm:items-end"
                    >
                      <div className="min-w-0 flex-1">
                        <label className="mb-1 block text-xs text-gray-500">动作名称</label>
                        <input
                          value={act.name}
                          onChange={(e) =>
                            updateAction(card.id, act.id, { name: e.target.value })
                          }
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/30"
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <label className="mb-1 block text-xs text-gray-500">类型</label>
                        <select
                          value={act.kind}
                          onChange={(e) =>
                            updateAction(card.id, act.id, {
                              kind: e.target.value as ToolboxActionKind,
                            })
                          }
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/30"
                        >
                          {ACTION_KIND_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-0 flex-1 sm:min-w-[200px]">
                        <label className="mb-1 block text-xs text-gray-500">备注</label>
                        <input
                          value={act.notes}
                          onChange={(e) =>
                            updateAction(card.id, act.id, { notes: e.target.value })
                          }
                          placeholder="脚本路径、入参说明等"
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/30"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAction(card.id, act.id)}
                        className="self-end rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="删除动作"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {config.cards.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center text-sm text-gray-500">
          暂无百宝箱卡片，请点击「新增百宝箱」。
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:left-64">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            完成百宝箱信息编辑、脚本参数配置调整后，在此统一保存。保存成功后，前台可通过后续对接读取该配置。
          </p>
          <button
            type="button"
            onClick={() => void handleSaveAll()}
            disabled={saving}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-md disabled:opacity-50 ${accentBtn}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存全部配置
          </button>
        </div>
      </div>
    </div>
  );
}
