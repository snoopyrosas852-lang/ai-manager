import { useState, useEffect } from 'react';
import { Loader2, Zap, Plus, X, Pencil } from 'lucide-react';
import { getSkills, getSkill, updateSkill, createSkill, getProjects } from '../../api/config';
import { useRole } from '../../hooks/useRole';
import type { SkillConfig, ProjectConfig } from '../../types/config';

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
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="skill-create-title">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="skill-create-title" className="text-lg font-semibold text-gray-900">{isEdit ? '编辑 Skill' : '新建 Skill'}</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill ID（英文标识，不可重复）</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="例如：order_query、logistics_track"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">使用指令（何时用、怎么用）</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="当用户询问...时使用。结合...提醒。"
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use when（逗号分隔）</label>
            <input
              value={useWhenText}
              onChange={(e) => setUseWhenText(e.target.value)}
              placeholder="查订单, 物流到哪了, 待交付"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Do NOT use（逗号分隔）</label>
            <input
              value={doNotUseText}
              onChange={(e) => setDoNotUseText(e.target.value)}
              placeholder="查商品, 退货"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">触发示例（逗号分隔）</label>
            <input
              value={triggerExamplesText}
              onChange={(e) => setTriggerExamplesText(e.target.value)}
              placeholder="本月待交付, 物流进度, 发货情况"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">依赖 API（逗号分隔）</label>
            <input
              value={requiredApisText}
              onChange={(e) => setRequiredApisText(e.target.value)}
              placeholder="order_list, docking_sync"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联项目（逗号分隔，填项目 ID）</label>
            <input
              value={associatedProjectsText}
              onChange={(e) => setAssociatedProjectsText(e.target.value)}
              placeholder="cssc, project_a"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {projects.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">可选: {projects.map((p) => p.id).join(', ')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skill-enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="skill-enabled" className="text-sm font-medium text-gray-700">启用</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
              取消
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SkillManager() {
  const [skills, setSkills] = useState<SkillConfig[]>([]);
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Skill 管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理系统支持的技能及其启用状态</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 新建 Skill
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> 加载中...
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Zap className="w-8 h-8 mb-2" />
            <p className="text-sm">暂无 Skill 配置</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Skill ID</th>
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">描述</th>
                  <th className="px-4 py-3 font-medium">关联项目</th>
                  <th className="px-4 py-3 font-medium">API</th>
                  <th className="px-4 py-3 font-medium w-20">状态</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{skill.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{skill.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[240px] truncate" title={skill.instructions || skill.description}>{skill.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {skill.associatedProjects.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {(skill.requiredApis ?? []).join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => setEditingSkill(skill)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggle(skill)}
                          disabled={!isAdmin || togglingId === skill.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            skill.enabled ? 'bg-blue-600' : 'bg-gray-300'
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
                ))}
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
