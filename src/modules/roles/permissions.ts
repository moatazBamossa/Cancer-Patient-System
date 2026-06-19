import { useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { RolePermissionModule, RolePermissionAction } from './rolePermissions';
import type { RolePermissions } from './types';

// ─── Pure Functions ───────────────────────────────────────────

/** Check if a specific action is allowed for a module */
export function hasPermission(
  permissions: RolePermissions | Partial<RolePermissions> | undefined | null,
  module: RolePermissionModule,
  action: RolePermissionAction,
): boolean {
  if (!permissions) return false;
  const mod = permissions[module];
  if (!mod) return false;
  if(typeof mod === 'boolean') {
    return mod; // For dashboard which is a boolean
  }
  return !!mod[action];
}

/** Check if a user can access a module (at least one action is true) */
export function canAccessModule(
  permissions: RolePermissions | Partial<RolePermissions> | undefined | null,
  module: RolePermissionModule,
): boolean {
  if (!permissions) return false;
  if(module === 'dashboard') {
    return !!permissions.dashboard;
  }
  const mod = permissions[module];
  if (!mod) return false;
  return mod.list || mod.create || mod.update || mod.delete;
}

// ─── React Hooks (Redux-backed) ──────────────────────────────

export function usePermissions(): RolePermissions | Partial<RolePermissions> | undefined {
  const role = useAppSelector((state) => state.auth.role);
  if (!role) return undefined;
  if (role.permissions && typeof role.permissions === 'object') {
    return role.permissions;
  }
  return role as unknown as RolePermissions;
}

/** Check if the current user has a specific permission */
export function useHasPermission(
  module: RolePermissionModule,
  action: RolePermissionAction,
): boolean {
  const permissions = usePermissions();
  return useMemo(() => hasPermission(permissions, module, action), [permissions, module, action]);
}

/** Check if the current user can access a module */
export function useCanAccessModule(module: RolePermissionModule): boolean {
  const permissions = usePermissions();
  return useMemo(() => canAccessModule(permissions, module), [permissions, module]);
}

/** Get all permission flags for a module */
export function useModulePermissions(module: RolePermissionModule) {
  const permissions = usePermissions();
  return useMemo(() => {
    const mod = permissions?.[module];
    if(typeof mod === 'boolean') {
      return {
        canList: mod,
        canCreate: mod,
        canUpdate: mod,
        canDelete: mod,
      };
    }
    return {
      canList: !!mod?.list,
      canCreate: !!mod?.create,
      canUpdate: !!mod?.update,
      canDelete: !!mod?.delete,
    };
  }, [permissions, module]);
}
