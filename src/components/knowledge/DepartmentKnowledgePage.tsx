/**
 * 部门知识库（文件云盘）— 与「QA 知识库」区分：本页管理可上传目录树与按部门 ACL
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Plus,
  ChevronRight,
  Save,
  Loader2,
  Shield,
  Building2,
} from 'lucide-react';
import type { KbAcl, KbDepartment, KbNode } from '../../api/knowledgeBase';
import {
  kbListDepartments,
  kbCreateDepartment,
  kbPatchDepartment,
  kbDeleteDepartment,
  kbListNodes,
  kbSearchNodes,
  kbCreateFolder,
  kbRenameNode,
  kbDeleteNode,
  kbUploadFile,
  kbListAcls,
  kbSetAcls,
  kbStats,
  kbPatchNode,
} from '../../api/knowledgeBase';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DepartmentKnowledgePage() {
  const [departments, setDepartments] = useState<KbDepartment[]>([]);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: '全部根目录' },
  ]);
  const [nodes, setNodes] = useState<KbNode[]>([]);
  const [selected, setSelected] = useState<KbNode | null>(null);
  const [acls, setAcls] = useState<KbAcl[]>([]);
  const [stats, setStats] = useState<{ usedBytes: number; quotaBytes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchHits, setSearchHits] = useState<KbNode[] | null>(null);
  const [savingAcl, setSavingAcl] = useState(false);

  const refreshDepartments = useCallback(() => {
    kbListDepartments().then((r) => setDepartments(r.items));
  }, []);

  const refreshNodes = useCallback(async (parentId: string | null) => {
    const r = await kbListNodes(parentId);
    setNodes(r.items);
  }, []);

  const refreshStats = useCallback(() => {
    kbStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refreshDepartments();
        await refreshNodes(null);
        refreshStats();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshDepartments, refreshNodes, refreshStats]);

  useEffect(() => {
    if (searchQ.trim()) {
      kbSearchNodes(searchQ.trim())
        .then((r) => setSearchHits(r.items))
        .catch(() => setSearchHits([]));
    } else {
      setSearchHits(null);
    }
  }, [searchQ]);

  useEffect(() => {
    if (!selected || selected.type !== 'folder') {
      setAcls([]);
      return;
    }
    kbListAcls(selected.id)
      .then((r) => setAcls(r.items))
      .catch(() => setAcls([]));
  }, [selected]);

  async function enterFolder(n: KbNode) {
    if (n.type !== 'folder') return;
    setCurrentParentId(n.id);
    setBreadcrumbs((b) => [...b, { id: n.id, name: n.name }]);
    setSelected(null);
    setLoading(true);
    try {
      await refreshNodes(n.id);
    } finally {
      setLoading(false);
    }
  }

  async function goBreadcrumb(idx: number) {
    const crumb = breadcrumbs[idx];
    setBreadcrumbs((b) => b.slice(0, idx + 1));
    setCurrentParentId(crumb.id);
    setSelected(null);
    setLoading(true);
    try {
      await refreshNodes(crumb.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewFolder() {
    const name = prompt('文件夹名称', '新建文件夹');
    if (!name) return;
    await kbCreateFolder(currentParentId, name);
    await refreshNodes(currentParentId);
    refreshStats();
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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || !currentParentId) {
      alert(currentParentId ? '请选择文件' : '请先双击进入某一文件夹，再上传文件到该文件夹');
      e.target.value = '';
      return;
    }
    for (const f of Array.from(files)) {
      const b64 = await fileToBase64(f);
      await kbUploadFile(currentParentId, f.name, f.type || 'application/octet-stream', b64);
    }
    e.target.value = '';
    await refreshNodes(currentParentId);
    refreshStats();
  }

  async function handleRename(n: KbNode) {
    const name = prompt('新名称', n.name);
    if (!name || name === n.name) return;
    await kbRenameNode(n.id, name);
    await refreshNodes(currentParentId);
  }

  async function handleDelete(n: KbNode) {
    if (!confirm(`确定删除「${n.name}」？`)) return;
    await kbDeleteNode(n.id);
    setSelected(null);
    await refreshNodes(currentParentId);
    refreshStats();
  }

  async function saveAcls() {
    if (!selected || selected.type !== 'folder') return;
    setSavingAcl(true);
    try {
      const payload = acls.map((a) => ({
        subjectType: a.subjectType,
        subjectId: a.subjectId,
        permission: a.permission,
        inherit: a.inherit,
      }));
      await kbSetAcls(selected.id, payload);
      alert('权限已保存');
    } catch {
      alert('保存失败');
    } finally {
      setSavingAcl(false);
    }
  }

  function addAclRow() {
    const deptId = prompt('部门 ID（须已在左侧部门字典中存在）');
    if (!deptId) return;
    setAcls((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        nodeId: selected!.id,
        subjectType: 'dept',
        subjectId: deptId,
        permission: 'read',
        inherit: true,
      },
    ]);
  }

  const listToRender = searchHits ?? nodes;

  if (loading && !nodes.length && !departments.length) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> 加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">部门资料与 ACL</h1>
        <p className="text-sm text-slate-500 mt-1">
          对应小仙 PRD V1.0.2 模块 A：部门隔离云盘；与「对话 QA 知识库（JSON）」「受管文档与向量」区分。
        </p>
      </div>
      <div className="flex flex-col xl:flex-row min-h-[min(70vh,720px)] gap-4">
      {/* 部门字典 */}
      <div className="w-56 shrink-0 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Building2 className="w-4 h-4" />
          部门字典
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {departments.map((d) => (
            <div
              key={d.id}
              className="text-xs px-2 py-1.5 rounded-lg bg-slate-50 text-slate-700 flex justify-between gap-1"
            >
              <span className="truncate" title={d.id}>
                {d.name}
              </span>
              <span className="text-slate-400 shrink-0">{d.id}</span>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-slate-100 space-y-1">
          <button
            type="button"
            className="w-full text-xs py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={async () => {
              const id = prompt('部门 ID（英文标识，如 dept-hr）');
              const name = prompt('部门名称');
              if (!id || !name) return;
              await kbCreateDepartment({ id, name });
              refreshDepartments();
            }}
          >
            + 添加部门
          </button>
          <button
            type="button"
            className="w-full text-xs py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            onClick={async () => {
              const id = prompt('要禁用的部门 ID');
              if (!id) return;
              await kbPatchDepartment(id, { enabled: false });
              refreshDepartments();
            }}
          >
            禁用部门
          </button>
          <button
            type="button"
            className="w-full text-xs py-1.5 rounded-lg border border-red-100 text-red-700 hover:bg-red-50"
            onClick={async () => {
              const id = prompt('删除部门 ID（谨慎）');
              if (!id) return;
              await kbDeleteDepartment(id);
              refreshDepartments();
            }}
          >
            删除部门
          </button>
        </div>
      </div>

      {/* 主区：云盘 */}
      <div className="flex-1 min-w-0 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-slate-600 min-w-0 flex-1">
            {breadcrumbs.map((c, i) => (
              <span key={`${c.id}-${i}`} className="flex items-center gap-1 shrink-0">
                {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                <button
                  type="button"
                  className={`hover:text-blue-600 truncate max-w-[140px] ${i === breadcrumbs.length - 1 ? 'font-medium text-slate-900' : ''}`}
                  onClick={() => goBreadcrumb(i)}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>
          {stats && (
            <span className="text-xs text-slate-500">
              已用 {formatBytes(stats.usedBytes)} / {formatBytes(stats.quotaBytes)}
            </span>
          )}
        </div>
        <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-slate-50">
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              onClick={handleNewFolder}
            >
              <Plus className="w-4 h-4" /> 新建文件夹
            </button>
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm cursor-pointer hover:bg-slate-50">
            <Upload className="w-4 h-4" /> 上传
            <input type="file" className="hidden" multiple onChange={handleUpload} />
          </label>
          <input
            type="search"
            placeholder="搜索文件名（全局）"
            className="flex-1 min-w-[120px] max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">名称</th>
                <th className="px-4 py-2 font-medium w-32">类型</th>
                <th className="px-4 py-2 font-medium w-28">大小</th>
                <th className="px-4 py-2 font-medium w-44">更新时间</th>
                <th className="px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {listToRender.map((n) => (
                <tr
                  key={n.id}
                  className={`border-t border-slate-100 hover:bg-slate-50/80 cursor-pointer ${selected?.id === n.id ? 'bg-blue-50/60' : ''}`}
                  onClick={() => setSelected(n)}
                  onDoubleClick={() => n.type === 'folder' && enterFolder(n)}
                >
                  <td className="px-4 py-2.5 flex items-center gap-2">
                    {n.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate text-slate-800">{n.name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{n.type === 'folder' ? '文件夹' : '文件'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{n.size != null ? formatBytes(n.size) : '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">
                    {n.updatedAt ? new Date(n.updatedAt).toLocaleString('zh-CN') : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      className="text-xs text-blue-600 mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(n);
                      }}
                    >
                      重命名
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n);
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {!listToRender.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    {searchHits ? '无匹配结果' : '此目录为空，可新建文件夹或进入子目录上传'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {selected?.type === 'folder' && (
          <div className="text-xs text-slate-500 px-4 py-2 border-t border-slate-100">
            提示：双击文件夹进入；选中文件夹后可在右侧配置部门 ACL。
          </div>
        )}
      </div>

      {/* ACL */}
      <div className="w-72 shrink-0 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Shield className="w-4 h-4" />
          部门权限
        </div>
        {!selected || selected.type !== 'folder' ? (
          <div className="p-4 text-sm text-slate-500">请选择一个文件夹以编辑 ACL（继承仅对子文件/子文件夹生效）</div>
        ) : (
          <>
            <div className="px-3 py-2 text-xs text-slate-600 border-b border-slate-50 truncate" title={selected.name}>
              节点：{selected.name}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {acls.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-100 p-2 space-y-1">
                  <div className="text-xs font-medium text-slate-800">{a.subjectId}</div>
                  <select
                    className="w-full text-xs border rounded px-1 py-1"
                    value={a.permission}
                    onChange={(e) => {
                      const v = e.target.value as 'read' | 'write';
                      setAcls((prev) => prev.map((x) => (x.id === a.id ? { ...x, permission: v } : x)));
                    }}
                  >
                    <option value="read">只读</option>
                    <option value="write">读写</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={a.inherit}
                      onChange={(e) => {
                        const c = e.target.checked;
                        setAcls((prev) => prev.map((x) => (x.id === a.id ? { ...x, inherit: c } : x)));
                      }}
                    />
                    继承到子级
                  </label>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => setAcls((prev) => prev.filter((x) => x.id !== a.id))}
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                className="w-full text-xs py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                onClick={addAclRow}
              >
                + 添加部门授权
              </button>
              <button
                type="button"
                disabled={savingAcl}
                className="w-full inline-flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-[#a31515] text-white hover:bg-[#8c1212] disabled:opacity-50"
                onClick={saveAcls}
              >
                {savingAcl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                保存权限
              </button>
            </div>
            <div className="p-3 border-t border-amber-100 bg-amber-50/40 space-y-2">
              <div className="text-xs font-semibold text-amber-900">知识库 / 问答</div>
              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-300"
                  checked={!!selected.excludeFromKb}
                  onChange={async (e) => {
                    const v = e.target.checked;
                    try {
                      await kbPatchNode(selected.id, { excludeFromKb: v });
                      setSelected({ ...selected, excludeFromKb: v });
                      alert(v ? '已标记：本目录及子项不参与知识库检索与资料问答' : '已取消黑名单标记');
                    } catch {
                      alert('更新失败');
                    }
                  }}
                />
                <span>
                  本目录及子项<strong>不参与</strong>知识库与资料问答（黑名单，V1.0.2）
                </span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
