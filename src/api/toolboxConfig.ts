import { http } from './http';
import { shouldUseMock } from './env';
import type { ToolboxActionKind, ToolboxConfig } from '../types/toolboxConfig';

const MOCK: ToolboxConfig = {
  mode: 'single_draft',
  versionLabel: '唯一生效版本',
  updatedAt: new Date().toISOString(),
  cards: [
    {
      id: 'card-xh-01',
      title: '物料类目匹配（咸亨平台）',
      subtitle: '基础字段负责前台展示，动作列表决定点击后的真实执行方式。',
      enabled: true,
      favoritable: true,
      actions: [{ id: 'act-1', name: '类目匹配主流程', kind: 'internal', notes: '' }],
    },
    {
      id: 'card-pdf-01',
      title: 'PDF 合并',
      subtitle: '多份附件合成一份归档。',
      enabled: true,
      favoritable: false,
      actions: [{ id: 'act-6', name: '合并任务', kind: 'python', notes: '' }],
    },
  ],
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

export async function getToolboxConfig(): Promise<ToolboxConfig> {
  if (shouldUseMock()) return clone(MOCK);
  return http.get<ToolboxConfig>('/api/admin/toolbox/config');
}

export async function saveToolboxConfig(config: ToolboxConfig): Promise<ToolboxConfig> {
  if (shouldUseMock()) {
    return { ...clone(config), updatedAt: new Date().toISOString() };
  }
  return http.put<ToolboxConfig>('/api/admin/toolbox/config', config);
}

export const ACTION_KIND_OPTIONS: { value: ToolboxActionKind; label: string }[] = [
  { value: 'internal', label: '内部编排' },
  { value: 'http', label: 'HTTP 调用' },
  { value: 'python', label: 'Python 脚本' },
];
