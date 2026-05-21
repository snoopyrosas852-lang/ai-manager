import { http } from './http';
import { shouldUseMock } from './env';
import type { NavRolesPayload } from '../types/navRoles';

const MOCK: NavRolesPayload = {
  catalog: [
    { id: 'xiaoxian', label: '小仙', path: '/', description: 'AI 对话主页' },
    { id: 'toolbox', label: '小仙百宝箱', path: '/workbench/toolbox', description: '文档与工具箱' },
    { id: 'tasks', label: '任务中心', path: '/workbench/tasks', description: '异步任务与下载' },
    {
      id: 'tender-materials',
      label: '招标资料',
      path: '/workbench/tender-materials',
      description: '招标资料整理',
    },
    {
      id: 'dept-knowledge',
      label: '部门知识库',
      path: '/workbench/dept-knowledge',
      description: '部门资料与知识文档',
    },
    {
      id: 'xiaoxian-avatar',
      label: '小仙分身',
      path: '/workbench/xiaoxian-avatar',
      description: '发现固定智能体分身并发起对话',
    },
  ],
  defaultRoleId: 'role-chat-toolbox',
  roles: [
    {
      id: 'role-all',
      name: '超级管理员',
      description: '默认可见全部导航模块',
      navModuleIds: [
        'xiaoxian',
        'toolbox',
        'tasks',
        'tender-materials',
        'dept-knowledge',
        'xiaoxian-avatar',
      ],
    },
    {
      id: 'role-chat-toolbox',
      name: '普通用户',
      description: '对话 + 百宝箱',
      navModuleIds: [
        'xiaoxian',
        'toolbox',
        'tasks',
        'tender-materials',
        'dept-knowledge',
        'xiaoxian-avatar',
      ],
    },
  ],
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

let mockState: NavRolesPayload = clone(MOCK);

export async function getNavRoles(): Promise<NavRolesPayload> {
  if (shouldUseMock()) return clone(mockState);
  return http.get<NavRolesPayload>('/api/admin/nav-roles');
}

export async function saveNavRoles(
  payload: Pick<NavRolesPayload, 'defaultRoleId' | 'roles' | 'catalog'>,
): Promise<NavRolesPayload> {
  if (shouldUseMock()) {
    mockState = {
      ...mockState,
      ...payload,
      catalog: payload.catalog ?? mockState.catalog,
      roles: payload.roles,
      defaultRoleId: payload.defaultRoleId,
    };
    return clone(mockState);
  }
  return http.put<NavRolesPayload>('/api/admin/nav-roles', payload);
}

