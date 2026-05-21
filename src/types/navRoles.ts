export interface NavModuleCatalogItem {
  id: string;
  label: string;
  path: string;
  description?: string;
}

export interface NavRole {
  id: string;
  name: string;
  description: string;
  navModuleIds: string[];
}

export interface NavRolesPayload {
  catalog: NavModuleCatalogItem[];
  defaultRoleId: string;
  roles: NavRole[];
  /** 为 true 时表示超级管理员/普通用户两套固定角色，不可在后台编辑 */
  fixed?: boolean;
}
