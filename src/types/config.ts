/** OpenClaw 风格：description + instructions 隐式定义意图 */
export interface SkillRequires {
  env?: string[];
  bins?: string[];
  config?: string[];
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  /** 使用指令（何时用、怎么用），注入 LLM Prompt */
  instructions?: string;
  /** Use when - 何时触发 */
  useWhen?: string[];
  /** Do NOT use - 何时不触发 */
  doNotUse?: string[];
  /** Gating：满足条件才加载 */
  requires?: SkillRequires;
  triggerExamples: string[];
  requiredApis: string[];
  associatedProjects: string[];
  enabled: boolean;
  /** 是否暴露为用户 / 命令 */
  userInvocable?: boolean;
  /** 禁用模型自动调用，仅手动触发 */
  disableModelInvocation?: boolean;
  updatedAt?: string;
}

export interface ProjectConfig {
  id: string;
  name: string;
  shortName: string;
  aliases: string[];
  customerMatchKeywords: string[];
  enabledSkills: string[];
  knowledgeBasePrefix: string;
  enabled: boolean;
}

export interface KnowledgeBaseItem {
  id: string;
  projectId: string;
  name: string;
  description: string;
  content: string;
  publishedAt: string | null;
  updatedAt: string;
  updatedBy: string;
  status: 'draft' | 'published';
}

export interface KnowledgeVersion {
  id: string;
  version: number;
  content: string;
  publishedAt: string;
  publishedBy: string;
  comment?: string;
}

export interface AdminUser {
  id: number;
  name: string;
  role: string;
  /** 工号，如 xhgj000615 */
  salesCode: string | null;
  /** 所属部门 */
  department?: string;
  managedProjects: string[];
  lastLoginAt: string;
}

/** 组织树节点（咸亨组织架构） */
export interface OrgTreeNode {
  id: string;
  name: string;
  children?: OrgTreeNode[];
}

/** 意图改写/拆解规则：匹配用户问题后可选改写文案，并产出结构化拆解（工具、项目、知识库）供大模型与后端使用 */
export interface IntentRewriteRule {
  id: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
  /** 建议使用的工具/Skill ID 列表，便于大模型选择调用哪个工具 */
  suggestedSkillIds?: string[];
  /** 建议查询的项目 ID，便于查哪个项目的数据 */
  suggestedProjectId?: string;
  /** 建议调用的知识库片段/关键词，便于检索哪部分知识库 */
  suggestedKnowledgeKeys?: string[];
}

/** 工具栏单项（对应前台输入框下的工具按钮） */
export interface ToolbarItem {
  id: string;
  label: string;
  skillIds: string[];
}

/** 前台助理配置（欢迎语、意图改写、工具栏） */
export interface AssistantConfig {
  welcomeMessage: string;
  welcomeSubtext: string;
  intentRewriteRules: IntentRewriteRule[];
  toolbar: ToolbarItem[];
}
