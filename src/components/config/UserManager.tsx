import { useState, useEffect, useMemo } from 'react';
import { Loader2, Users, Search, ChevronRight, ChevronDown, Settings, Upload, X } from 'lucide-react';
import { getUsers, getOrgTree, updateUser } from '../../api/config';
import { useRole } from '../../hooks/useRole';
import type { AdminUser, OrgTreeNode } from '../../types/config';

/** 仅两种角色：超级管理员可登录后台，普通用户仅可在前台提问 */
const ROLES = [
  { value: 'admin', label: '超级管理员' },
  { value: 'user', label: '普通用户' },
];

function normalizeRoleToken(raw: string): 'admin' | 'user' | null {
  const t = raw.trim().toLowerCase();
  if (t === 'admin' || t === '超级管理员') return 'admin';
  if (t === 'user' || t === '普通用户') return 'user';
  return null;
}

type BatchImportRow = {
  sourceLine: number;
  salesCode: string;
  role: 'admin' | 'user';
};

/** 首行是否为「工号,角色」类表头（跳过） */
function batchFirstRowLooksLikeHeader(line: string): boolean {
  const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''));
  if (parts.length !== 2) return false;
  const c0 = parts[0] || '';
  const c1 = parts[1] || '';
  return /^(工号|salescode|标识)$/i.test(c0) && /^(角色|角色id)$/i.test(c1);
}

/** 解析批量文本：仅两列「工号,角色」，分隔符支持逗号、分号、制表符 */
function parseBatchRoleImport(text: string): { rows: BatchImportRow[]; parseErrors: string[] } {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
  const parseErrors: string[] = [];
  const rows: BatchImportRow[] = [];
  if (lines.length === 0) return { rows, parseErrors };

  let start = 0;
  if (batchFirstRowLooksLikeHeader(lines[0])) {
    start = 1;
  }

  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length !== 2) {
      parseErrors.push(`第 ${i + 1} 行：须为两列「工号,角色」`);
      continue;
    }
    const salesCode = parts[0];
    const roleRaw = parts[1];
    const role = normalizeRoleToken(roleRaw);
    if (!role) {
      parseErrors.push(`第 ${i + 1} 行：无效角色「${roleRaw}」，角色填 admin / user 或 超级管理员 / 普通用户`);
      continue;
    }
    if (!salesCode) {
      parseErrors.push(`第 ${i + 1} 行：工号为空`);
      continue;
    }
    rows.push({
      sourceLine: i + 1,
      salesCode,
      role,
    });
  }
  return { rows, parseErrors };
}

function resolveUserForBatchRow(users: AdminUser[], row: BatchImportRow): AdminUser | undefined {
  const sc = row.salesCode.trim().toLowerCase();
  return users.find((u) => u.salesCode && u.salesCode.toLowerCase() === sc);
}

function collectDepartmentNames(node: OrgTreeNode): string[] {
  const names: string[] = [node.name];
  if (node.children?.length) {
    node.children.forEach((c) => names.push(...collectDepartmentNames(c)));
  }
  return names;
}

function OrgTree({
  tree,
  selectedId,
  onSelect,
  searchDept,
}: {
  tree: OrgTreeNode[];
  selectedId: string | null;
  onSelect: (id: string, name: string) => void;
  searchDept: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function filterNodes(nodes: OrgTreeNode[]): OrgTreeNode[] {
    if (!searchDept.trim()) return nodes;
    const k = searchDept.trim().toLowerCase();
    return nodes
      .map((n) => {
        const childFiltered = n.children?.length ? filterNodes(n.children) : [];
        const matchSelf = n.name.toLowerCase().includes(k);
        if (matchSelf || childFiltered.length > 0) {
          return { ...n, children: childFiltered.length ? childFiltered : n.children };
        }
        return null;
      })
      .filter(Boolean) as OrgTreeNode[];
  }

  const filtered = useMemo(() => filterNodes(tree), [tree, searchDept]);

  function renderNode(node: OrgTreeNode, depth: number) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id] ?? true;
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          style={{ paddingLeft: depth * 12 }}
          className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer text-sm ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
          }`}
          onClick={() => onSelect(node.id, node.name)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="p-0.5 -m-0.5"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
              }}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span className="truncate flex-1">{node.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children!.map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    );
  }

  return <div className="py-1">{filtered.map((n) => renderNode(n, 0))}</div>;
}

interface ConfigRoleModalProps {
  user: AdminUser;
  onSave: (userId: number, role: string) => Promise<void>;
  onClose: () => void;
}

function ConfigRoleModal({ user, onSave, onClose }: ConfigRoleModalProps) {
  const [role, setRole] = useState(user.role === 'admin' ? 'admin' : 'user');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(user.id, role);
      onClose();
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6" role="dialog" aria-modal="true">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">配置角色 - {user.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前角色</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              取消
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BATCH_SAMPLE = `工号,角色
xhgj000615,admin
xhgj001188,user`;

interface BatchImportModalProps {
  users: AdminUser[];
  onClose: () => void;
  applyBatch: (
    updates: { userId: number; role: string }[],
  ) => Promise<{ success: number; failed: number; errors: string[] }>;
}

function BatchImportModal({ users, onClose, applyBatch }: BatchImportModalProps) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<
    { row: BatchImportRow; user: AdminUser | null; err?: string }[]
  >([]);
  const [running, setRunning] = useState(false);

  function runPreview() {
    const { rows, parseErrors } = parseBatchRoleImport(text);
    if (parseErrors.length) {
      alert(parseErrors.slice(0, 8).join('\n') + (parseErrors.length > 8 ? `\n…共 ${parseErrors.length} 条` : ''));
    }
    const seen = new Map<string, BatchImportRow>();
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      const key = r.salesCode.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, r);
    }
    const unique = [...seen.values()].reverse();
    const prev = unique.map((row) => {
      const user = resolveUserForBatchRow(users, row);
      if (!user) {
        return {
          row,
          user: null,
          err: `未找到工号 ${row.salesCode}`,
        };
      }
      return { row, user };
    });
    setPreview(prev);
  }

  async function handleConfirm() {
    const ok = preview.filter((p) => p.user && !p.err);
    if (ok.length === 0) {
      alert('没有可应用的行，请先粘贴内容并点击「预览匹配」');
      return;
    }
    setRunning(true);
    try {
      const res = await applyBatch(ok.map((p) => ({ userId: p.user!.id, role: p.row.role })));
      if (res.failed === 0) {
        alert(`已更新 ${res.success} 名用户角色`);
        onClose();
      } else {
        const tail = res.errors.length > 5 ? `等共 ${res.errors.length} 条` : '';
        const sample = res.errors.slice(0, 5).join('；');
        alert(`成功 ${res.success} 条，失败 ${res.failed} 条。${sample}${tail}`);
        if (res.success > 0) onClose();
      }
    } catch {
      alert('批量保存失败');
    } finally {
      setRunning(false);
    }
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result || ''));
      e.target.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">批量导入角色</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              选择文件
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={handlePickFile} />
            </label>
            <button
              type="button"
              onClick={() => setText(BATCH_SAMPLE)}
              className="px-3 py-2 text-sm text-blue-600 hover:underline"
            >
              填入示例
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              '默认格式：工号,角色（每行一条）\n示例：xhgj000615,admin'
            }
            rows={10}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={runPreview}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            预览匹配
          </button>

          {preview.length > 0 && (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                    <th className="px-3 py-2">源行</th>
                    <th className="px-3 py-2">匹配用户</th>
                    <th className="px-3 py-2">工号</th>
                    <th className="px-3 py-2">角色</th>
                    <th className="px-3 py-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((p, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-500">{p.row.sourceLine}</td>
                      <td className="px-3 py-2">{p.user?.name ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.user?.salesCode ?? p.row.salesCode}</td>
                      <td className="px-3 py-2">
                        {p.row.role === 'admin' ? '超级管理员' : '普通用户'}
                      </td>
                      <td className="px-3 py-2">
                        {p.err ? <span className="text-red-600">{p.err}</span> : <span className="text-emerald-600">待应用</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            取消
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void handleConfirm()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {running && <Loader2 className="w-4 h-4 animate-spin" />}
            确认导入
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orgTree, setOrgTree] = useState<OrgTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptSearch, setDeptSearch] = useState('');
  const [userNameSearch, setUserNameSearch] = useState('');
  const [employeeIdSearch, setEmployeeIdSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedDeptNames, setSelectedDeptNames] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [configRoleUser, setConfigRoleUser] = useState<AdminUser | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const { isAdmin } = useRole();

  useEffect(() => {
    Promise.all([getUsers(), getOrgTree()]).then(([u, t]) => {
      setUsers(u);
      setOrgTree(t);
    }).catch(() => {
      alert('获取数据失败');
    }).finally(() => setLoading(false));
  }, []);

  const deptNamesBySelected = useMemo(() => {
    if (!selectedDeptId || !orgTree.length) return [];
    function find(node: OrgTreeNode, id: string): string[] | null {
      if (node.id === id) return collectDepartmentNames(node);
      for (const c of node.children ?? []) {
        const found = find(c, id);
        if (found) return found;
      }
      return null;
    }
    for (const n of orgTree) {
      const names = find(n, selectedDeptId);
      if (names) return names;
    }
    return [];
  }, [orgTree, selectedDeptId]);

  useEffect(() => {
    setSelectedDeptNames(deptNamesBySelected);
  }, [deptNamesBySelected]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (userNameSearch.trim() && !u.name.toLowerCase().includes(userNameSearch.trim().toLowerCase())) return false;
      if (employeeIdSearch.trim() && (!u.salesCode || !u.salesCode.toLowerCase().includes(employeeIdSearch.trim().toLowerCase()))) return false;
      if (selectedDeptNames.length > 0 && !selectedDeptNames.includes(u.department)) return false;
      return true;
    });
  }, [users, userNameSearch, employeeIdSearch, selectedDeptNames]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [userNameSearch, employeeIdSearch, selectedDeptId]);

  function handleSelectDept(id: string, name: string) {
    setSelectedDeptId(id);
  }

  async function handleSaveRole(userId: number, role: string) {
    await updateUser(userId, { role });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }

  async function applyBatchRoleUpdates(updates: { userId: number; role: string }[]) {
    const applied: { userId: number; role: string }[] = [];
    const errors: string[] = [];
    for (const u of updates) {
      try {
        await updateUser(u.userId, { role: u.role });
        applied.push(u);
      } catch {
        errors.push(`用户 ID ${u.userId} 保存失败`);
      }
    }
    if (applied.length) {
      setUsers((prev) => {
        const map = new Map(applied.map((x) => [x.userId, x.role]));
        return prev.map((user) => (map.has(user.id) ? { ...user, role: map.get(user.id)! } : user));
      });
    }
    return { success: applied.length, failed: errors.length, errors };
  }

  const roleLabel = (roleValue: string) =>
    roleValue === 'admin' ? '超级管理员' : '普通用户';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">用户权限管理</h1>
        <p className="text-sm text-gray-500 mt-1">按组织与工号管理用户，配置角色：仅超级管理员可登录后台，普通用户仅可在前台页面提问</p>
      </div>

      <div className="flex gap-4 min-h-[500px]">
        {/* 左侧组织树 */}
        <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="搜索部门"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <OrgTree
              tree={orgTree}
              selectedId={selectedDeptId}
              onSelect={handleSelectDept}
              searchDept={deptSearch}
            />
          </div>
        </div>

        {/* 右侧：搜索 + 表格 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={userNameSearch}
                onChange={(e) => setUserNameSearch(e.target.value)}
                placeholder="用户名称：请输入"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={employeeIdSearch}
                onChange={(e) => setEmployeeIdSearch(e.target.value)}
                placeholder="工号：请输入"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setPage(1)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                查询
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setBatchOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  批量导入
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 flex flex-col">
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Users className="w-8 h-8 mb-2" />
                <p className="text-sm">暂无用户数据</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                        <th className="px-4 py-3 font-medium">用户名称</th>
                        <th className="px-4 py-3 font-medium">所属部门</th>
                        <th className="px-4 py-3 font-medium">工号</th>
                        <th className="px-4 py-3 font-medium min-w-[5rem]">当前角色</th>
                        <th className="px-4 py-3 font-medium w-28">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((user) => (
                        <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                          <td className="px-4 py-3 text-gray-600">{user.department || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{user.salesCode ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                              {roleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => setConfigRoleUser(user)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                              >
                                <Settings className="w-3.5 h-3.5" /> 配置角色
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-t border-gray-100 text-sm text-gray-500">
                  <span>共 {filtered.length} 条数据</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="rounded border border-gray-200 px-2 py-1 text-sm"
                    >
                      {[10, 20, 50].map((n) => (
                        <option key={n} value={n}>{n}条/页</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-2 py-1 rounded border border-gray-200 disabled:opacity-50 text-sm"
                    >
                      上一页
                    </button>
                    <span className="text-gray-600">{page} / {totalPages}</span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-2 py-1 rounded border border-gray-200 disabled:opacity-50 text-sm"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {configRoleUser && (
        <ConfigRoleModal
          user={configRoleUser}
          onSave={handleSaveRole}
          onClose={() => setConfigRoleUser(null)}
        />
      )}

      {batchOpen && (
        <BatchImportModal
          users={users}
          onClose={() => setBatchOpen(false)}
          applyBatch={applyBatchRoleUpdates}
        />
      )}
    </div>
  );
}
