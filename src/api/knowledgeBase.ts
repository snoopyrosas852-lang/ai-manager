import { http } from './http';

export interface KbDepartment {
  id: string;
  name: string;
  sort?: number;
  enabled?: boolean;
}

export interface KbNode {
  id: string;
  parentId: string | null;
  type: 'folder' | 'file';
  name: string;
  size: number | null;
  mime: string | null;
  ownerUserLabel?: string;
  ownerDeptId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** 文件夹：不参与知识库/问答（黑名单），V1.0.2 */
  excludeFromKb?: boolean;
}

export interface KbAcl {
  id: string;
  nodeId: string;
  subjectType: string;
  subjectId: string;
  /** 只读=仅预览；只读/下载=预览+下载；协作者=写（上传/删/改名等） */
  permission: 'read' | 'read_download' | 'write';
  inherit: boolean;
}

export async function kbListDepartments() {
  return http.get<{ items: KbDepartment[] }>('/api/admin/kb/departments');
}

export async function kbCreateDepartment(body: { id: string; name: string; sort?: number }) {
  return http.post<{ ok: boolean }>('/api/admin/kb/departments', body);
}

export async function kbPatchDepartment(id: string, body: Partial<KbDepartment>) {
  return http.patch<{ ok: boolean }>(`/api/admin/kb/departments/${id}`, body);
}

export async function kbDeleteDepartment(id: string) {
  return http.del<{ ok: boolean }>(`/api/admin/kb/departments/${id}`);
}

export async function kbListNodes(parentId: string | null, flat?: boolean) {
  const q: Record<string, string | boolean> = {};
  if (parentId === null) q.parentId = 'null';
  else if (parentId !== undefined) q.parentId = parentId;
  if (flat) q.flat = true;
  return http.get<{ items: KbNode[] }>('/api/admin/kb/nodes', q);
}

export async function kbSearchNodes(q: string) {
  return http.get<{ items: KbNode[] }>('/api/admin/kb/search', { q });
}

export async function kbCreateFolder(parentId: string | null, name: string) {
  return http.post<{ id: string }>('/api/admin/kb/nodes', {
    parentId: parentId === null ? null : parentId,
    name,
  });
}

export async function kbRenameNode(id: string, name: string) {
  return http.patch<{ ok: boolean }>(`/api/admin/kb/nodes/${id}`, { name });
}

export async function kbPatchNode(
  id: string,
  body: { name?: string; parentId?: string | null; excludeFromKb?: boolean },
) {
  return http.patch<{ ok: boolean }>(`/api/admin/kb/nodes/${id}`, body);
}

export async function kbMoveNode(id: string, parentId: string | null) {
  return http.patch<{ ok: boolean }>(`/api/admin/kb/nodes/${id}`, {
    parentId: parentId === null ? null : parentId,
  });
}

export async function kbDeleteNode(id: string) {
  return http.del<{ ok: boolean }>(`/api/admin/kb/nodes/${id}`);
}

export async function kbUploadFile(parentId: string, name: string, mime: string, base64: string) {
  return http.post<{ id: string }>('/api/admin/kb/files', { parentId, name, mime, base64 });
}

export async function kbListAcls(nodeId: string) {
  return http.get<{ items: KbAcl[] }>(`/api/admin/kb/nodes/${nodeId}/acls`);
}

export async function kbSetAcls(
  nodeId: string,
  acls: Pick<KbAcl, 'subjectType' | 'subjectId' | 'permission' | 'inherit'>[],
) {
  return http.put<{ ok: boolean }>(`/api/admin/kb/nodes/${nodeId}/acls`, { acls });
}

export async function kbStats() {
  return http.get<{ usedBytes: number; quotaBytes: number }>('/api/admin/kb/stats');
}
