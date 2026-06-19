import React from 'react';
import { useHasPermission } from '../../modules/roles/permissions';
import type { RolePermissionModule, RolePermissionAction } from '../../modules/roles/rolePermissions';

interface PermissionGuardProps {
  module: RolePermissionModule;
  action: RolePermissionAction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action,
  fallback = null,
  children,
}) => {
  const hasPermission = useHasPermission(module, action);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export { PermissionGuard };
