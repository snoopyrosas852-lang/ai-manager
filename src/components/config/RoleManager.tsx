import { useCallback, useEffect, useState } from 'react';
import {
  Info,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Shield,
} from 'lucide-react';
import { getNavRoles, saveNavRoles } from '../../api/navRoles';
import type { NavModuleCatalogItem, NavRole, NavRolesPayload } from '../../types/navRoles';

const accentBtn = 'bg-[#a31515] hover:bg-[#8f1212]';

function moduleSummary(ids: string[], catalog: { id: string; label: string }[]) {
  const map = new Map(catalog.map((c) => [c.id, c.label]));
  return ids.map((id) => map.get(id) || id).join('、') || '—';
}

export default function RoleManager() {
  const [payload, setPayload] = useState<NavRolesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; role?: NavRole } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNavRoles();
      setPayload(data);
    } catch {
      alert('加载角色配置失败');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!payload) return;
    const catIds = payload.catalog.map((m) => m.id.trim()).filter(Boolean);
    if (new Set(catIds).size !== catIds.length) {
      alert('模块字典中存在重复的模块 ID');
      return;
    }
    for (const m of payload.catalog) {
      if (!m.id.trim()) {
        alert('模块 ID 不能为空');
        return;
      }
      if (!m.label.trim()) {
        alert(`模块「${m.id}」的显示名称不能为空`);
        return;
      }
      if (!String(m.path ?? '').trim()) {
        alert(`模块「${m.id}」的路径不能为空`);
        return;
      }
    }
    for (const r of payload.roles) {
      if ((r.navModuleIds?.length ?? 0) === 0) {
        alert(`角色「${r.name}」至少选择一个导航模块`);
        return;
      }
    }
    setSaving(true);
    try {
      const saved = await saveNavRoles({
        defaultRoleId: payload.defaultRoleId,
        roles: payload.roles,
        catalog: payload.catalog,
      });
      setPayload(saved);
      alert('保存成功');
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  function patchCatalogItem(index: number, patch: Partial<NavModuleCatalogItem>) {
    if (!payload) return;
    const old = payload.catalog[index];
    if (!old) return;
    const merged: NavModuleCatalogItem = {
      id: patch.id !== undefined ? patch.id.trim() : old.id,
      label: patch.label !== undefined ? patch.label : old.label,
      path: patch.path !== undefined ? patch.path : old.path,
      description:
        patch.description !== undefined ? patch.description : old.description,
    };
    const catalog = [...payload.catalog];
    catalog[index] = merged;
    let roles = payload.roles;
    if (old.id !== merged.id && merged.id) {
      roles = payload.roles.map((r) => ({
        ...r,
        navModuleIds: r.navModuleIds.map((nid) => (nid === old.id ? merged.id : nid)),
      }));
    }
    setPayload({ ...payload, catalog, roles });
  }

  function removeCatalogItem(index: number) {
    if (!payload || payload.catalog.length <= 1) {
      alert('模块字典至少保留一项');
      return;
    }
    const removed = payload.catalog[index];
    const catalog = payload.catalog.filter((_, i) => i !== index);
    let roles = payload.roles.map((r) => ({
      ...r,
      navModuleIds: r.navModuleIds.filter((id) => id !== removed.id),
    }));
    const fallback = catalog[0]?.id;
    if (fallback) {
      roles = roles.map((r) => ({
        ...r,
        navModuleIds: r.navModuleIds.length ? r.navModuleIds : [fallback],
      }));
    }
    setPayload({ ...payload, catalog, roles });
  }

  function addCatalogItem() {
    if (!payload) return;
    const id = `module-${Date.now()}`;
    setPayload({
      ...payload,
      catalog: [...payload.catalog, { id, label: '新模块', path: '/', description: '' }],
    });
  }

  function deleteRole(id: string) {
    if (!payload || payload.roles.length <= 1) {
      alert('至少保留一个角色');
      return;
    }
    if (!confirm('确定删除该角色？')) return;
    const nextRoles = payload.roles.filter((r) => r.id !== id);
    let defaultRoleId = payload.defaultRoleId;
    if (defaultRoleId === id) {
      defaultRoleId = nextRoles[0]?.id ?? '';
    }
    setPayload({ ...payload, roles: nextRoles, defaultRoleId });
  }

  function openCreate() {
    const catalog = payload?.catalog ?? [];
    setModal({
      mode: 'create',
      role: {
        id: `role-${Date.now()}`,
        name: '新角色',
        description: '',
        navModuleIds: catalog.length ? [catalog[0].id] : ['xiaoxian'],
      },
    });
  }

  function openEdit(role: NavRole) {
    setModal({ mode: 'edit', role: { ...role } });
  }

  function submitModal() {
    if (!modal?.role || !payload) return;
    const r = modal.role;
    if (!r.name.trim()) {
      alert('请填写角色名称');
      return;
    }
    if ((r.navModuleIds?.length ?? 0) === 0) {
      alert('至少选择一个导航模块');
      return;
    }
    if (modal.mode === 'create') {
      if (payload.roles.some((x) => x.id === r.id)) {
        alert('角色 ID 冲突，请关闭后重试');
        return;
      }
      setPayload({ ...payload, roles: [...payload.roles, { ...r, id: r.id.trim() }] });
    } else {
      setPayload({
        ...payload,
        roles: payload.roles.map((x) => (x.id === r.id ? { ...r } : x)),
      });
    }
    setModal(null);
  }

  if (loading || !payload) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> 加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">角色管理</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-500">
          为每个角色勾选小仙前台左侧导航可见模块；保存后，拉取管理后台公开接口的小仙客户端将按当前默认角色或前台指定的角色 ID 展示对应入口。
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-[#a31515]/15 bg-[#a31515]/[0.06] px-4 py-3 text-sm text-gray-700">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#a31515]" aria-hidden />
        <p>
          模块清单与前台<strong className="font-semibold text-gray-900">工作空间左侧导航</strong>
          一致。支持新增、编辑、删除角色；请至少保留一个角色并保存。
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            默认角色（未指定前台角色 ID 时使用）
          </label>
          <select
            value={payload.defaultRoleId}
            onChange={(e) => setPayload({ ...payload, defaultRoleId: e.target.value })}
            className="max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
          >
            {payload.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}（{r.id}）
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" /> 新建角色
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 ${accentBtn}`}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存配置
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">角色列表</h2>
          <p className="mt-0.5 text-xs text-gray-500">每个角色绑定一组导航模块；至少保留一个角色。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">角色名称</th>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">可见模块</th>
                <th className="px-4 py-3 font-medium">说明</th>
                <th className="w-32 px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {payload.roles.map((role) => (
                <tr key={role.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Shield className="h-4 w-4 shrink-0 text-[#a31515]/80" />
                      {role.name}
                      {payload.defaultRoleId === role.id && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          默认
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{role.id}</td>
                  <td className="max-w-xs px-4 py-3 text-gray-700">
                    <span className="line-clamp-2" title={moduleSummary(role.navModuleIds, payload.catalog)}>
                      {moduleSummary(role.navModuleIds, payload.catalog)}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-gray-500">
                    <span className="line-clamp-2">{role.description || '—'}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(role)}
                      className="mr-2 inline-flex items-center rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#a31515]"
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRole(role.id)}
                      disabled={payload.roles.length <= 1}
                      className="inline-flex items-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 bg-gray-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">模块字典</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              与前台左侧导航项对应；修改后需点击「保存配置」。修改模块 ID 时，已勾选该模块的角色会自动替换为新 ID。
            </p>
          </div>
          <button
            type="button"
            onClick={addCatalogItem}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" /> 新增模块
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-600">
                <th className="px-2 py-2 font-medium">模块 ID</th>
                <th className="px-2 py-2 font-medium">显示名称</th>
                <th className="px-2 py-2 font-medium">路径</th>
                <th className="min-w-[140px] px-2 py-2 font-medium">说明（选填）</th>
                <th className="w-14 px-2 py-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {payload.catalog.map((m, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="px-2 py-2 align-top">
                    <input
                      value={m.id}
                      onChange={(e) => patchCatalogItem(index, { id: e.target.value })}
                      className="w-full min-w-[7rem] rounded border border-gray-200 px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      value={m.label}
                      onChange={(e) => patchCatalogItem(index, { label: e.target.value })}
                      className="w-full min-w-[6rem] rounded border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      value={m.path}
                      onChange={(e) => patchCatalogItem(index, { path: e.target.value })}
                      className="w-full min-w-[8rem] rounded border border-gray-200 px-2 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      value={m.description ?? ''}
                      onChange={(e) => patchCatalogItem(index, { description: e.target.value })}
                      placeholder="—"
                      className="w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => removeCatalogItem(index)}
                      disabled={payload.catalog.length <= 1}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.role && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} aria-hidden />
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {modal.mode === 'create' ? '新建角色' : '编辑角色'}
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">角色名称</label>
                <input
                  value={modal.role.name}
                  onChange={(e) => setModal({ ...modal, role: { ...modal.role!, name: e.target.value } })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                />
              </div>
              {modal.mode === 'create' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">角色 ID（英文，保存后勿随意改）</label>
                  <input
                    value={modal.role.id}
                    onChange={(e) =>
                      setModal({ ...modal, role: { ...modal.role!, id: e.target.value.trim() } })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                    placeholder="role-sales"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">说明</label>
                <textarea
                  value={modal.role.description}
                  onChange={(e) =>
                    setModal({ ...modal, role: { ...modal.role!, description: e.target.value } })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">可见导航模块</p>
                <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  {payload.catalog.map((m) => {
                    const checked = modal.role!.navModuleIds.includes(m.id);
                    return (
                      <label key={m.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const ids = new Set(modal.role!.navModuleIds);
                            if (e.target.checked) ids.add(m.id);
                            else ids.delete(m.id);
                            setModal({
                              ...modal,
                              role: { ...modal.role!, navModuleIds: [...ids] },
                            });
                          }}
                          className="mt-1 rounded border-gray-300 text-[#a31515] focus:ring-[#a31515]/40"
                        />
                        <span>
                          <span className="font-medium text-gray-900">{m.label}</span>
                          <span className="ml-2 font-mono text-xs text-gray-400">{m.id}</span>
                          {m.description && (
                            <span className="mt-0.5 block text-xs text-gray-500">{m.description}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitModal}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${accentBtn}`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
