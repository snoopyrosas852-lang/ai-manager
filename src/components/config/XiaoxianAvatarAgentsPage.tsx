/**
 * 小仙分身 — 固定智能体配置（列表 + 新建/编辑表单，含路由类型）
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Save, Trash2, Sparkles, Globe, ChevronRight, ImageIcon } from 'lucide-react';
import {
  fetchAvatarAgentsAdmin,
  createAvatarAgent,
  updateAvatarAgent,
  removeAvatarAgent,
  type AvatarAgent,
  type AvatarRouteKind,
  type AvatarVisibility,
  type PageBgStyle,
} from '../../api/avatarAgents';

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

const ROUTE_OPTIONS: { value: AvatarRouteKind; label: string; hint: string }[] = [
  { value: 'chat', label: '打开对话', hint: '路由参数：可选 Skill ID，英文逗号分隔，将随请求一并提交。' },
  { value: 'external_link', label: '外链', hint: '路由参数：完整 URL（https://…）。' },
  { value: 'spa_path', label: '站内路径', hint: '路由参数：以小仙前台路由为准，如 /workbench/toolbox。' },
];

const VIS_OPTIONS: { value: AvatarVisibility; label: string }[] = [
  { value: 'public', label: '公开 · 所有人可对话/查看卡片' },
  { value: 'login_only', label: '登录可见（前台仍可展示卡片，可按需收紧）' },
];

const PAGE_BG_OPTIONS: { value: PageBgStyle; label: string }[] = [
  { value: 'default', label: '默认（前台卡片灰底）' },
  { value: 'solid', label: '纯色背景' },
  { value: 'gradient', label: '渐变背景' },
  { value: 'image', label: '自定义背景图' },
];

function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('图片须小于 1.5MB'));
      return;
    }
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('读取失败'));
    r.readAsDataURL(file);
  });
}

function emptyDraft(): Partial<AvatarAgent> {
  return {
    name: '',
    description: '',
    systemPrompt: '',
    category: 'work',
    avatarEmoji: '🤖',
    avatarImageUrl: '',
    visibility: 'public',
    routeKind: 'chat',
    routePayload: '',
    statsLabel: '',
    authorLabel: '@咸亨小仙官方',
    enabled: true,
    sortOrder: 100,
    pageBgStyle: 'default',
    pageBgColor: '#e8eef5',
    pageBgGradientStart: '#e0e7ff',
    pageBgGradientEnd: '#fce7f3',
    pageBgImageUrl: '',
  };
}

export default function XiaoxianAvatarAgentsPage() {
  const [payload, setPayload] = useState<{ agents: AvatarAgent[]; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AvatarAgent> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAvatarAgentsAdmin();
      setPayload(data);
    } catch {
      alert('加载小仙分身配置失败');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(emptyDraft());
    setModalOpen(true);
  }

  function openEdit(a: AvatarAgent) {
    setEditing({
      ...a,
      pageBgStyle: (a.pageBgStyle as PageBgStyle) || 'default',
      pageBgColor: a.pageBgColor || '#e8eef5',
      pageBgGradientStart: a.pageBgGradientStart || '#e0e7ff',
      pageBgGradientEnd: a.pageBgGradientEnd || '#fce7f3',
      pageBgImageUrl: a.pageBgImageUrl || '',
      avatarImageUrl: a.avatarImageUrl || '',
    });
    setModalOpen(true);
  }

  async function submitForm() {
    if (!editing) return;
    const name = String(editing.name || '').trim();
    if (!name) {
      alert('请输入名称');
      return;
    }
    setSaving(true);
    try {
      const next =
        editing.id && payload?.agents.some((x) => x.id === editing.id)
          ? await updateAvatarAgent(editing.id, editing)
          : await createAvatarAgent(editing);
      setPayload(next);
      setModalOpen(false);
      setEditing(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('确认删除该分身？')) return;
    try {
      const next = await removeAvatarAgent(id);
      setPayload(next);
    } catch {
      alert('删除失败');
    }
  }

  async function onAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editing) return;
    try {
      const dataUrl = await readImageDataUrl(file);
      setEditing({ ...editing, avatarImageUrl: dataUrl });
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    }
  }

  async function onPageBgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editing) return;
    try {
      const dataUrl = await readImageDataUrl(file);
      setEditing({ ...editing, pageBgImageUrl: dataUrl, pageBgStyle: 'image' });
    } catch (err) {
      alert(err instanceof Error ? err.message : '上传失败');
    }
  }

  const pageBgStyle = (editing?.pageBgStyle || 'default') as PageBgStyle;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">小仙分身配置</h1>
            <p className="text-sm text-slate-500 mt-1">
              配置前台「发现智能体」卡片：名称、设定描述（System Prompt）、权限与<strong>路由</strong>。
              前台用户点击后将按路由跳转或带着分身上下文进入对话。
            </p>
            {payload?.updatedAt ? (
              <p className="text-xs text-slate-400 mt-2">
                最近更新：{new Date(payload.updatedAt).toLocaleString('zh-CN')}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新建分身
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : !payload?.agents?.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 py-16 text-center text-slate-500">
          暂无配置，请点击「新建分身」
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">头像</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">名称</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">路由</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">状态</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 w-40">操作</th>
              </tr>
            </thead>
            <tbody>
              {[...payload.agents]
                .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'zh-Hans-CN'))
                .map((a) => (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      {a.avatarImageUrl ? (
                        <img
                          src={a.avatarImageUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <span className="text-xl">{a.avatarEmoji || '🤖'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{a.routeKind}</span>
                      {a.routePayload ? (
                        <span className="block text-xs text-slate-400 truncate max-w-[220px] mt-1" title={a.routePayload}>
                          {a.routePayload}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {a.enabled ? '启用' : '停用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
                        className="text-blue-600 hover:underline mr-3"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDelete(a.id)}
                        className="text-red-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 border border-slate-200">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-center text-slate-900">
                {editing.id ? '编辑小仙分身' : '新建小仙分身'}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-4xl border-2 border-dashed border-slate-200 overflow-hidden">
                  {editing.avatarImageUrl ? (
                    <img src={editing.avatarImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{editing.avatarEmoji || '🤖'}</span>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100">
                  <ImageIcon className="w-4 h-4" />
                  上传头像图片
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => void onAvatarFile(e)} />
                </label>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800"
                  onClick={() => setEditing({ ...editing, avatarImageUrl: '' })}
                >
                  清除自定义头像
                </button>
                <label className="text-xs text-slate-500 w-full max-w-xs">
                  无图时占位 Emoji（可选）
                  <input
                    value={editing.avatarEmoji || ''}
                    onChange={(e) => setEditing({ ...editing, avatarEmoji: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="例如 🤖"
                  />
                </label>
                <button
                  type="button"
                  className="text-sm text-pink-600 flex items-center gap-1 opacity-80 hover:opacity-100"
                  title="演示占位：后续可接一键生成名称与设定"
                >
                  ✨ 一键完善（预留）
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">名称</label>
                <input
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  placeholder="输入名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">卡片简介</label>
                <input
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  placeholder="列表卡片下的灰色说明文字"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">设定描述（System Prompt）</label>
                <textarea
                  value={editing.systemPrompt || ''}
                  onChange={(e) => setEditing({ ...editing, systemPrompt: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="示例：你是一位经验丰富的英语老师..."
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <label className="block text-sm font-medium text-slate-800">背景页装修（前台卡片区域）</label>
                <p className="text-xs text-slate-500">用于小仙分身卡片底图；默认与前台灰底一致。</p>
                <select
                  value={pageBgStyle}
                  onChange={(e) => {
                    const v = e.target.value as PageBgStyle;
                    setEditing({
                      ...editing,
                      pageBgStyle: v,
                      ...(v !== 'image' ? { pageBgImageUrl: '' } : {}),
                    });
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                >
                  {PAGE_BG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {pageBgStyle === 'solid' ? (
                  <label className="block text-xs text-slate-600">
                    背景色
                    <input
                      type="color"
                      value={editing.pageBgColor || '#e8eef5'}
                      onChange={(e) => setEditing({ ...editing, pageBgColor: e.target.value })}
                      className="mt-1 block h-10 w-full rounded-lg border border-slate-200 cursor-pointer"
                    />
                  </label>
                ) : null}
                {pageBgStyle === 'gradient' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-600">
                      起始色
                      <input
                        type="color"
                        value={editing.pageBgGradientStart || '#e0e7ff'}
                        onChange={(e) => setEditing({ ...editing, pageBgGradientStart: e.target.value })}
                        className="mt-1 block h-10 w-full rounded-lg border border-slate-200 cursor-pointer"
                      />
                    </label>
                    <label className="text-xs text-slate-600">
                      结束色
                      <input
                        type="color"
                        value={editing.pageBgGradientEnd || '#fce7f3'}
                        onChange={(e) => setEditing({ ...editing, pageBgGradientEnd: e.target.value })}
                        className="mt-1 block h-10 w-full rounded-lg border border-slate-200 cursor-pointer"
                      />
                    </label>
                  </div>
                ) : null}
                {pageBgStyle === 'image' ? (
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
                      上传背景图
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => void onPageBgFile(e)} />
                    </label>
                    {editing.pageBgImageUrl ? (
                      <div className="relative h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img src={editing.pageBgImageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-800"
                      onClick={() => setEditing({ ...editing, pageBgImageUrl: '' })}
                    >
                      清除背景图
                    </button>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">配置路由</label>
                <div className="space-y-2 rounded-xl border border-slate-200 p-3 bg-slate-50/80">
                  <select
                    value={editing.routeKind || 'chat'}
                    onChange={(e) =>
                      setEditing({ ...editing, routeKind: e.target.value as AvatarRouteKind })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                  >
                    {ROUTE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    {ROUTE_OPTIONS.find((r) => r.value === editing.routeKind)?.hint}
                  </p>
                  <input
                    value={editing.routePayload || ''}
                    onChange={(e) => setEditing({ ...editing, routePayload: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white font-mono text-xs"
                    placeholder={
                      editing.routeKind === 'chat'
                        ? 'order_query 或多个 Skill：id1,id2'
                        : editing.routeKind === 'external_link'
                          ? 'https://example.com'
                          : '/workbench/toolbox'
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">权限设置</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                  <select
                    value={editing.visibility || 'public'}
                    onChange={(e) =>
                      setEditing({ ...editing, visibility: e.target.value as AvatarVisibility })
                    }
                    className="flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none cursor-pointer"
                  >
                    {VIS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">热度文案</label>
                  <input
                    value={editing.statsLabel || ''}
                    onChange={(e) => setEditing({ ...editing, statsLabel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="例如 1352 人使用过"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">作者标识</label>
                  <input
                    value={editing.authorLabel || ''}
                    onChange={(e) => setEditing({ ...editing, authorLabel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="@咸亨小仙官方"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.enabled !== false}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">启用（前台展示）</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void submitForm()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing.id ? '保存' : '创建分身'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
