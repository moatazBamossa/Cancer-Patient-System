import React from 'react';
import { useCanAccessModule } from '../../modules/roles/permissions';
import type { RolePermissionModule } from '../../modules/roles/rolePermissions';
import { AccessDenied } from './AccessDenied';

interface ModuleGuardProps {
  module: RolePermissionModule;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const ModuleGuard: React.FC<ModuleGuardProps> = ({
  module,
  fallback,
  children,
}) => {
  const canAccess = useCanAccessModule(module);

  if (!canAccess) {
    return <>{fallback ?? <AccessDenied />}</>;
  }

  return <>{children}</>;
};

export { ModuleGuard };
