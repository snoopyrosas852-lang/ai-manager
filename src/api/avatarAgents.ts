import { http } from './http';

export type AvatarCategory = 'work' | 'study' | 'creation' | 'life';
export type AvatarRouteKind = 'chat' | 'external_link' | 'spa_path';
export type AvatarVisibility = 'public' | 'login_only';
/** 卡片/背景页装修：前台用于卡片区域背景 */
export type PageBgStyle = 'default' | 'solid' | 'gradient' | 'image';

export interface AvatarAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  category: AvatarCategory;
  /** 无自定义头像时的占位 */
  avatarEmoji: string;
  /** 自定义头像（data URL 或 https 地址） */
  avatarImageUrl?: string;
  visibility: AvatarVisibility;
  routeKind: AvatarRouteKind;
  /** chat：可选 Skill ID，逗号分隔；外链：完整 URL；站内：路径如 /workbench/toolbox */
  routePayload: string;
  statsLabel: string;
  authorLabel: string;
  enabled: boolean;
  sortOrder: number;
  pageBgStyle?: PageBgStyle;
  pageBgColor?: string;
  pageBgGradientStart?: string;
  pageBgGradientEnd?: string;
  pageBgImageUrl?: string;
  updatedAt?: string;
}

export interface AvatarAgentsAdminPayload {
  agents: AvatarAgent[];
  updatedAt: string;
}

export async function fetchAvatarAgentsAdmin(): Promise<AvatarAgentsAdminPayload> {
  return http.get('/api/admin/avatar-agents');
}

export async function createAvatarAgent(body: Partial<AvatarAgent>): Promise<AvatarAgentsAdminPayload> {
  return http.post('/api/admin/avatar-agents', body);
}

export async function updateAvatarAgent(
  id: string,
  body: Partial<AvatarAgent>,
): Promise<AvatarAgentsAdminPayload> {
  return http.put(`/api/admin/avatar-agents/${encodeURIComponent(id)}`, body);
}

export async function removeAvatarAgent(id: string): Promise<AvatarAgentsAdminPayload> {
  return http.del(`/api/admin/avatar-agents/${encodeURIComponent(id)}`);
}
