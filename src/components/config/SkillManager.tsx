import { useState, useEffect } from 'react';
import { Loader2, Zap, Plus, X, Pencil, RefreshCw, Info } from 'lucide-react';
import { getSkills, updateSkill, createSkill, getProjects } from '../../api/config';
import { useRole } from '../../hooks/useRole';
import type { SkillConfig, ProjectConfig } from '../../types/config';

/** 与参考页（gateway 管理后台）一致的主按钮色 */
const accentBtn = 'bg-[#a31515] hover:bg-[#8f1212] focus:ring-[#a31515]';

function parseList(s: string): string[] {
  return s.split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean);
}

interface SkillFormModalProps {
  skill?: SkillConfig | null;
  projects: ProjectConfig[];
  onSubmit: (data: SkillConfig) => Promise<void>;
  onClose: () => void;
}

function SkillFormModal({ skill, projects, onSubmit, onClose }: SkillFormModalProps) {
  const isEdit = !!skill;
  const [id, setId] = useState(skill?.id ?? '');
  const [name, setName] = useState(skill?.name ?? '');
  const [description, setDescription] = useState(skill?.description ?? '');
  const [instructions, setInstructions] = useState(skill?.instructions ?? '');
  const [useWhenText, setUseWhenText] = useState((skill?.useWhen ?? []).join(', '));
  const [doNotUseText, setDoNotUseText] = useState((skill?.doNotUse ?? []).join(', '));
  const [triggerExamplesText, setTriggerExamplesText] = useState((skill?.triggerExamples ?? []).join(', '));
  const [requiredApisText, setRequiredApisText] = useState((skill?.requiredApis ?? []).join(', '));
  const [associatedProjectsText, setAssociatedProjectsText] = useState((skill?.associatedProjects ?? []).join(', '));
  const [enabled, setEnabled] = useState(skill?.enabled ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const idTrim = id.trim().toLowerCase().replace(/\s+/g, '_');
    if (!idTrim || !name.trim()) {
      alert('请填写 Skill ID 和名称');
      return;
    }
    if (!isEdit && !/^[a-z0-9_-]+$/.test(idTrim)) {
      alert('Skill ID 仅允许小写字母、数字、下划线和连字符');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        id: idTrim,
        name: name.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        useWhen: parseList(useWhenText),
        doNotUse: parseList(doNotUseText),
        triggerExamples: parseList(triggerExamplesText),
        requiredApis: parseList(requiredApisText),
        associatedProjects: parseList(associatedProjectsText),
        enabled,
      });
      onClose();
    } catch (err: any) {
      alert(err?.message || (isEdit ? '更新失败' : '新建失败'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200/80" role="dialog" aria-modal="true" aria-labelledby="skill-create-title">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 id="skill-create-title" className="text-lg font-semibold text-gray-900">{isEdit ? '编辑 Skill' : '新建 Skill'}</h2>
              <p className="text-xs text-gray-500 mt-1">字段围绕 upstream 真实结构；关联项目请手工录入项目 ID。</p>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="rounded-xl border border-gray-100 bg-[#fafbfc] p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">基础信息</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill ID（英文标识，不可重复）</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="例如：order_query、logistics_track"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                required
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：订单查询"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述（OpenClaw：帮助 LLM 判断何时调用）</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="一句话描述该 Skill 的用途"
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35 resize-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-[#fafbfc] p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prompt 与触发边界</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用指令（何时用、怎么用）</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="当用户询问...时使用。结合...提醒。"
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Use when（逗号分隔）</label>
              <input
                value={useWhenText}
                onChange={(e) => setUseWhenText(e.target.value)}
                placeholder="查订单, 物流到哪了, 待交付"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Do NOT use（逗号分隔）</label>
              <input
                value={doNotUseText}
                onChange={(e) => setDoNotUseText(e.target.value)}
                placeholder="查商品, 退货"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-[#fafbfc] p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">触发示例与依赖</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">触发示例（逗号分隔）</label>
              <input
                value={triggerExamplesText}
                onChange={(e) => setTriggerExamplesText(e.target.value)}
                placeholder="本月待交付, 物流进度, 发货情况"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">依赖 API（逗号分隔）</label>
              <input
                value={requiredApisText}
                onChange={(e) => setRequiredApisText(e.target.value)}
                placeholder="order_list, docking_sync"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联项目（逗号分隔，填项目 ID）</label>
              <input
                value={associatedProjectsText}
                onChange={(e) => setAssociatedProjectsText(e.target.value)}
                placeholder="cssc, project_a"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a31515]/35"
              />
              {projects.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">候选项目 ID：{projects.map((p) => p.id).join('、')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="skill-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-[#a31515] focus:ring-[#a31515]/50"
            />
            <label htmlFor="skill-enabled" className="text-sm font-medium text-gray-700">启用</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5 ${accentBtn}`}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

export default function SkillManager() {
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillConfig | null>(null);
  const { isAdmin } = useRole();

  useEffect(() => {
    fetchSkills();
    getProjects().then(setProjects).catch(() => {});
  }, []);

  function normalizeSkill(s: Partial<SkillConfig>): SkillConfig {
    return {
      id: s.id ?? '',
      name: s.name ?? s.id ?? '',
      description: s.description ?? '',
      instructions: s.instructions ?? '',
      useWhen: Array.isArray(s.useWhen) ? s.useWhen : [],
      doNotUse: Array.isArray(s.doNotUse) ? s.doNotUse : [],
      requires: s.requires ?? { env: [], bins: [], config: [] },
      triggerExamples: Array.isArray(s.triggerExamples) ? s.triggerExamples : [],
      requiredApis: Array.isArray(s.requiredApis) ? s.requiredApis : [],
      associatedProjects: Array.isArray(s.associatedProjects) ? s.associatedProjects : [],
      enabled: s.enabled ?? true,
      userInvocable: s.userInvocable ?? true,
      disableModelInvocation: s.disableModelInvocation ?? false,
    };
  }

  async function fetchSkills() {
    setLoading(true);
    try {
      const data = await getSkills();
      setSkills(Array.isArray(data) ? data.map(normalizeSkill) : []);
    } catch {
      alert('获取 Skill 列表失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshList() {
    setRefreshing(true);
    try {
      const data = await getSkills();
      setSkills(Array.isArray(data) ? data.map(normalizeSkill) : []);
    } catch {
      alert('刷新失败，请稍后重试');
    } finally {
      setRefreshing(false);
    }
  }

  async function handleToggle(skill: SkillConfig) {
    if (!isAdmin) return;
    setTogglingId(skill.id);
    try {
      await updateSkill(skill.id, { enabled: !skill.enabled });
      setSkills((prev) =>
        prev.map((s) => (s.id === skill.id ? { ...s, enabled: !s.enabled } : s)),
      );
    } catch {
      alert('更新失败');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleCreateSkill(data: SkillConfig) {
    const created = await createSkill(data);
    setSkills((prev) => [...prev, normalizeSkill(created)]);
    setShowCreateModal(false);
  }

  async function handleUpdateSkill(data: SkillConfig) {
    await updateSkill(data.id, data);
    setSkills((prev) => prev.map((s) => (s.id === data.id ? normalizeSkill({ ...s, ...data }) : s)));
    setEditingSkill(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Skill 配置</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-3xl leading-relaxed">
          统一通过 gateway 管理 Skill 列表、启停、编辑与缓存刷新。高级字段暂不依赖项目选项接口，关联项目请手工录入。
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-[#a31515]/15 bg-[#a31515]/[0.06] px-4 py-3 text-sm text-gray-700">
        <Info className="w-5 h-5 shrink-0 text-[#a31515] mt-0.5" aria-hidden />
        <p>
          列表字段围绕 upstream 真实结构展开。「刷新缓存」将重新从服务端拉取 Skill 列表（本地 Mock 模式下等价于重新加载）。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">当前总数</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
            {skills.length}
            <span className="ml-1 text-base font-normal text-gray-500">个 Skill</span>
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">候选项目来源</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            当前无独立选项源，请在新建/编辑表单中<strong className="font-semibold text-gray-900">手工录入</strong>
            关联项目 ID。
          </p>
          {projects.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              已注册项目 ID 参考：{projects.map((p) => p.id).join('、')}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleRefreshList()}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新缓存
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${accentBtn}`}
          >
            <Plus className="h-4 w-4" /> 新建 Skill
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">当前 Skill 列表</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            列表字段直接围绕 upstream 真实结构展开，含触发示例、依赖 API 与关联项目等关键信息。
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 加载中...
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Zap className="mb-2 h-8 w-8 opacity-80" />
            <p className="text-sm">暂无 Skill，请点击「新建 Skill」添加</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-white text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">名称 / ID</th>
                  <th className="px-4 py-3 font-medium">描述</th>
                  <th className="px-4 py-3 font-medium">触发示例</th>
                  <th className="px-4 py-3 font-medium">依赖 API</th>
                  <th className="px-4 py-3 font-medium">关联项目</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">状态 / 操作</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => {
                  const desc = (skill.description || skill.instructions || '').trim();
                  const triggers = skill.triggerExamples ?? [];
                  const apis = skill.requiredApis ?? [];
                  const projectsCell = skill.associatedProjects ?? [];
                  return (
                    <tr key={skill.id} className="border-t border-gray-100 transition-colors hover:bg-gray-50/60">
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-gray-900">{skill.name}</div>
                        <div className="mt-0.5 font-mono text-xs text-gray-500">{skill.id}</div>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 align-top text-gray-600" title={desc}>
                        {desc ? (
                          <span className="line-clamp-2">{truncate(desc, 80)}</span>
                        ) : (
                          <span className="text-gray-400">暂无描述</span>
                        )}
                      </td>
                      <td className="max-w-[180px] px-4 py-3 align-top text-gray-600" title={triggers.join('，')}>
                        {triggers.length > 0 ? (
                          <span className="line-clamp-2">{truncate(triggers.join('，'), 48)}</span>
                        ) : (
                          <span className="text-gray-400">暂无触发示例</span>
                        )}
                      </td>
                      <td className="max-w-[160px] px-4 py-3 align-top font-mono text-xs text-gray-700" title={apis.join(', ')}>
                        {apis.length > 0 ? (
                          <span className="line-clamp-2">{truncate(apis.join(', '), 40)}</span>
                        ) : (
                          <span className="text-gray-400">暂无依赖 API</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {projectsCell.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {projectsCell.map((p) => (
                              <span
                                key={p}
                                className="rounded-md border border-[#a31515]/20 bg-[#a31515]/[0.07] px-2 py-0.5 text-xs font-medium text-[#7a1010]"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">手工录入</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              skill.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {skill.enabled ? '已启用' : '已停用'}
                          </span>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingSkill(skill)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#a31515]"
                              title="编辑"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggle(skill)}
                            disabled={!isAdmin || togglingId === skill.id}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a31515]/40 ${
                              skill.enabled ? 'bg-[#a31515]' : 'bg-gray-300'
                            } ${!isAdmin ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                skill.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <SkillFormModal
          projects={projects}
          onSubmit={handleCreateSkill}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {editingSkill && (
        <SkillFormModal
          skill={editingSkill}
          projects={projects}
          onSubmit={handleUpdateSkill}
          onClose={() => setEditingSkill(null)}
        />
      )}
    </div>
  );
}
