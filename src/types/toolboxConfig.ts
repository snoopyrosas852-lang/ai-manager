/** 百宝箱编排：与 server/toolboxConfigStore.js 对齐 */

export type ToolboxActionKind = 'python' | 'http' | 'internal';

export interface ToolboxActionConfig {
  id: string;
  name: string;
  kind: ToolboxActionKind;
  notes: string;
}

export interface ToolboxCardConfig {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  favoritable: boolean;
  actions: ToolboxActionConfig[];
}

export interface ToolboxConfig {
  mode: 'single_draft' | 'published';
  versionLabel: string;
  updatedAt: string;
  cards: ToolboxCardConfig[];
}
