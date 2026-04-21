import { http, setToken } from './http';

export interface AuthUser {
  id: number;
  name: string;
  role: string;
  salesCode: string | null;
  managedProjects: string[];
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function loginWithDingTalk(authCode: string): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>('/api/auth/dingtalk', { authCode });
  setToken(res.token);
  return res;
}

export async function getMe(): Promise<AuthUser> {
  return http.get<AuthUser>('/api/auth/me');
}
