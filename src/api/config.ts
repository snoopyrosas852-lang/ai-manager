import { http } from './http';
import { shouldUseMock } from './env';
import type {
  AdminUser,
  AssistantConfig,
  KnowledgeBaseItem,
  KnowledgeVersion,
  OrgTreeNode,
  ProjectConfig,
  SkillConfig,
} from '../types/config';
import {
  MOCK_SKILLS,
  MOCK_PROJECTS,
  MOCK_KB_LIST,
  MOCK_USERS,
  MOCK_ORG_TREE,
} from './mockAdmin';

async function withMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  if (shouldUseMock()) return mock;
  try {
    return await fn();
  } catch {
    return mock;
  }
}

/** Mock 模式下可写的 Skill 列表，供 getSkills/createSkill 使用 */
let mockSkillsStore: SkillConfig[] = [...MOCK_SKILLS];

export async function getSkills(): Promise<SkillConfig[]> {
  if (shouldUseMock()) return [...mockSkillsStore];
  try {
    return await http.get<SkillConfig[]>('/api/admin/skills');
  } catch {
    return [...mockSkillsStore];
  }
}

export async function getSkill(id: string): Promise<SkillConfig | null> {
  if (shouldUseMock()) return mockSkillsStore.find((s) => s.id === id) ?? null;
  try {
    return await http.get<SkillConfig>(`/api/admin/skills/${id}`);
  } catch {
    return null;
  }
}

export async function updateSkill(
  id: string,
  data: Partial<Omit<SkillConfig, 'id'>>,
): Promise<SkillConfig> {
  const res = await http.patch<SkillConfig>(`/api/admin/skills/${id}`, data);
  return res;
}

export async function createSkill(data: Omit<SkillConfig, 'id'> & { id: string }): Promise<SkillConfig> {
  if (shouldUseMock()) {
    const exists = mockSkillsStore.some((s) => s.id === data.id);
    if (exists) throw new Error('Skill ID 已存在');
    const item: SkillConfig = {
      id: data.id,
      name: data.name,
      description: data.description ?? '',
      instructions: data.instructions ?? '',
      useWhen: data.useWhen ?? [],
      doNotUse: data.doNotUse ?? [],
      requires: data.requires ?? { env: [], bins: [], config: [] },
      triggerExamples: data.triggerExamples ?? [],
      requiredApis: data.requiredApis ?? [],
      associatedProjects: data.associatedProjects ?? [],
      enabled: data.enabled ?? true,
      userInvocable: data.userInvocable ?? true,
      disableModelInvocation: data.disableModelInvocation ?? false,
    };
    mockSkillsStore.push(item);
    return item;
  }
  return http.post<SkillConfig>('/api/admin/skills', data);
}

/** Mock 模式下可写的项目列表副本，供 getProjects/updateProject 使用 */
let mockProjectsStore: ProjectConfig[] = [...MOCK_PROJECTS];

export async function getProjects(): Promise<ProjectConfig[]> {
  if (shouldUseMock()) return [...mockProjectsStore];
  try {
    return await http.get<ProjectConfig[]>('/api/admin/projects');
  } catch {
    return [...mockProjectsStore];
  }
}

export async function updateProject(
  id: string,
  data: Partial<Omit<ProjectConfig, 'id'>>
): Promise<void> {
  if (shouldUseMock()) {
    const idx = mockProjectsStore.findIndex((p) => p.id === id);
    if (idx >= 0) {
      mockProjectsStore[idx] = { ...mockProjectsStore[idx], ...data };
    }
    return;
  }
  await http.patch<void>(`/api/admin/projects/${id}`, data);
}

export async function createProject(data: Omit<ProjectConfig, 'id'> & { id: string }): Promise<ProjectConfig> {
  if (shouldUseMock()) {
    const exists = mockProjectsStore.some((p) => p.id === data.id);
    if (exists) throw new Error('项目 ID 已存在');
    const item: ProjectConfig = {
      id: data.id,
      name: data.name,
      shortName: data.shortName,
      aliases: data.aliases ?? [],
      customerMatchKeywords: data.customerMatchKeywords ?? [],
      enabledSkills: data.enabledSkills ?? [],
      knowledgeBasePrefix: data.knowledgeBasePrefix ?? data.id,
      enabled: data.enabled ?? true,
    };
    mockProjectsStore.push(item);
    return item;
  }
  return http.post<ProjectConfig>('/api/admin/projects', data);
}

/** Mock 模式下可写的知识库列表，供 getKnowledgeBases / createKnowledgeBase 使用 */
let mockKbStore: KnowledgeBaseItem[] = [...MOCK_KB_LIST];

export async function getKnowledgeBases(): Promise<KnowledgeBaseItem[]> {
  if (shouldUseMock()) return [...mockKbStore];
  try {
    return await http.get<KnowledgeBaseItem[]>('/api/admin/knowledge-base');
  } catch {
    return [...mockKbStore];
  }
}

export async function createKnowledgeBase(data: {
  projectId: string;
  name: string;
  description?: string;
  content?: string;
}): Promise<KnowledgeBaseItem> {
  if (shouldUseMock()) {
    const id = `kb-${data.projectId}-${Date.now()}`;
    const now = new Date().toISOString();
    const item: KnowledgeBaseItem = {
      id,
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? '',
      content: data.content ?? '{}',
      publishedAt: null,
      updatedAt: now,
      updatedBy: 'admin',
      status: 'draft',
    };
    mockKbStore.push(item);
    return item;
  }
  return http.post<KnowledgeBaseItem>('/api/admin/knowledge-base', data);
}

export async function getKnowledgeBase(id: string): Promise<KnowledgeBaseItem> {
  return withMock(
    () => http.get<KnowledgeBaseItem>(`/api/admin/knowledge-base/${id}`),
    MOCK_KB_LIST.find((k) => k.id === id) ?? MOCK_KB_LIST[0] ?? {
      id,
      projectId: 'cssc',
      name: '中船考核规则',
      content: '{}',
      description: '',
      publishedAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
      status: 'draft',
    }
  );
}

export async function updateKnowledgeBase(
  id: string,
  content: string,
): Promise<void> {
  try {
    await http.put<void>(`/api/admin/knowledge-base/${id}`, { content });
  } catch {
    return;
  }
}

export async function publishKnowledgeBase(id: string): Promise<void> {
  try {
    await http.post<void>(`/api/admin/knowledge-base/${id}/publish`);
  } catch {
    return;
  }
}

export async function getKnowledgeVersions(id: string): Promise<KnowledgeVersion[]> {
  return withMock(
    () => http.get<KnowledgeVersion[]>(`/api/admin/knowledge-base/${id}/versions`),
    []
  );
}

export async function rollbackKnowledgeBase(
  id: string,
  versionId: string,
): Promise<void> {
  try {
    await http.post<void>(`/api/admin/knowledge-base/${id}/rollback`, { versionId });
  } catch {
    return;
  }
}

let mockUsersStore: AdminUser[] = MOCK_USERS.map((u) => ({ ...u }));

export async function getUsers(): Promise<AdminUser[]> {
  if (shouldUseMock()) return [...mockUsersStore];
  try {
    return await http.get<AdminUser[]>('/api/admin/users');
  } catch {
    return [...mockUsersStore];
  }
}

export async function getOrgTree(): Promise<OrgTreeNode[]> {
  if (shouldUseMock()) return MOCK_ORG_TREE;
  try {
    return await http.get<OrgTreeNode[]>('/api/admin/org-tree');
  } catch {
    return MOCK_ORG_TREE;
  }
}

export async function updateUser(
  id: number,
  data: { role?: string; department?: string; managedProjects?: string[] },
): Promise<void> {
  if (shouldUseMock()) {
    const idx = mockUsersStore.findIndex((u) => u.id === id);
    if (idx >= 0 && data.role !== undefined) mockUsersStore[idx].role = data.role;
    if (idx >= 0 && data.department !== undefined) mockUsersStore[idx].department = data.department;
    if (idx >= 0 && data.managedProjects !== undefined) mockUsersStore[idx].managedProjects = data.managedProjects;
    return;
  }
  try {
    await http.patch<void>(`/api/admin/users/${id}`, data);
  } catch {
    return;
  }
}

// ---------- 前台助理配置 ----------
export async function getAssistantConfig(): Promise<AssistantConfig> {
  if (shouldUseMock()) {
    return {
      welcomeMessage: '我是小仙，有什么我能帮你的吗？',
      welcomeSubtext: '请先选择下方工具，然后输入您的问题',
      intentRewriteRules: [
        {
          id: 'rule-1',
          pattern: '违反.*中船考核红线',
          replacement: '触碰红线的订单',
          enabled: true,
          suggestedSkillIds: ['logistics_track', 'order_confirm_alert'],
          suggestedProjectId: 'cssc',
          suggestedKnowledgeKeys: ['考核红线', '违约金'],
        },
      ],
      toolbar: [{ id: 'order_query', label: '订单查询', skillIds: ['order_query'] }],
    };
  }
  return http.get<AssistantConfig>('/api/admin/assistant-config');
}

export async function updateAssistantConfig(data: Partial<AssistantConfig>): Promise<AssistantConfig> {
  const res = await http.put<AssistantConfig>('/api/admin/assistant-config', data);
  return res;
}
