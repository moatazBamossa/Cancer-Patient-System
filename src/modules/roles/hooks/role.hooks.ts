import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService } from '../services/role.service';
import { roleQueryKeys } from '../queries/role-query-keys';
import type { Role } from '../types';
import type { CreateRoleParams, UpdateRoleParams } from '../types';

export const useRolesQuery = () => {
  return useQuery<Role[], Error>({
    queryKey: roleQueryKeys.list(),
    queryFn: () => roleService.get_roles(),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

export const useRoleByIdQuery = (roleId?: number) => {
  return useQuery<Role | null, Error>({
    queryKey: roleQueryKeys.detail(roleId ?? 0),
    queryFn: () => roleService.get_role_by_id(roleId!),
    enabled: !!roleId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

export const useRoleByNameQuery = (roleName?: string) => {
  return useQuery<Role | null, Error>({
    queryKey: roleQueryKeys.byName(roleName ?? ''),
    queryFn: () => roleService.get_role_by_name(roleName ?? ''),
    enabled: !!roleName,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

export const useRolesPaginatedQuery = (limit = 10, offset = 0) => {
  return useQuery<Role[], Error>({
    queryKey: roleQueryKeys.paginated(limit, offset),
    queryFn: () => roleService.get_roles_paginated({ limit, offset }),
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

export function useCreateRoleMutation() {
  const qc = useQueryClient();
  return useMutation<Role, Error, CreateRoleParams>({
    mutationFn: (p) => roleService.create_role(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleQueryKeys.list() });
    },
    onError: () => {},
  });
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient();
  return useMutation<Role, Error, UpdateRoleParams>({
    mutationFn: (p) => roleService.update_role(p),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: roleQueryKeys.list() });
      qc.invalidateQueries({ queryKey: roleQueryKeys.detail(typeof variables.role_id === 'number' ? variables.role_id : Number(variables.role_id) || 0) });
    },
    onError: () => {},
  });
}

export function useDeleteRoleMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, number | string>({
    mutationFn: (id) => roleService.delete_role(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: roleQueryKeys.list() });
      qc.invalidateQueries({ queryKey: roleQueryKeys.detail(typeof id === 'number' ? id : Number(id) || 0) });
    },
    onError: () => {},
  });
}
