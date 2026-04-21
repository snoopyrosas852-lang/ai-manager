import { http } from './http';

export type CorpusType = 'prd' | 'tender' | 'catalog';
export type VectorStatus = 'queued' | 'syncing' | 'success' | 'failed';

export interface ManagedFileItem {
  id: string;
  corpusType: CorpusType;
  name: string;
  mime: string;
  size: number;
  deptIds: string[];
  vectorStatus: VectorStatus;
  error: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedSettings {
  ossBucketNote?: string;
  fastgptAppIdNote?: string;
}

export async function managedGetSettings() {
  return http.get<ManagedSettings>('/api/admin/kb/managed/settings');
}

export async function managedPutSettings(body: Partial<ManagedSettings>) {
  return http.put<ManagedSettings>('/api/admin/kb/managed/settings', body);
}

export async function managedListFiles(params?: { type?: string; q?: string }) {
  return http.get<{ items: ManagedFileItem[] }>('/api/admin/kb/managed/files', params);
}

export async function managedUploadFile(body: {
  corpusType: CorpusType;
  name: string;
  mime: string;
  base64: string;
  ownerDeptId?: string;
}) {
  return http.post<{ id: string; item: ManagedFileItem }>('/api/admin/kb/managed/files', body);
}

export async function managedRetryVector(id: string) {
  return http.post<{ ok: boolean }>(`/api/admin/kb/managed/files/${encodeURIComponent(id)}/retry`, {});
}
