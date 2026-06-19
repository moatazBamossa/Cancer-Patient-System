import type { RoleDto, Role, RolePermissions } from '../types';
import { defaultRolePermissions, ROLE_PERMISSION_MODULES } from '../rolePermissions';

export function normalizePermissions(input?: Partial<RolePermissions> | null): RolePermissions {
  const base = defaultRolePermissions();
  if (!input) return base as RolePermissions;

  const result: any = {};
  for (const moduleKey of ROLE_PERMISSION_MODULES) {
    const moduleInput = (input as any)[moduleKey];
    result[moduleKey] = {
      create: !!(moduleInput && moduleInput.create),
      list: !!(moduleInput && moduleInput.list),
      update: !!(moduleInput && moduleInput.update),
      delete: !!(moduleInput && moduleInput.delete),
    };
  }

  return result as RolePermissions;
}

export function normalizeRole(item: RoleDto): Role {
  return {
    role_id: item.role_id,
    role_name: item.role_name,
    permissions: normalizePermissions(item.permissions),
  };
}

export function normalizeRoles(items: RoleDto[]): Role[] {
  return items.map(normalizeRole);
}
