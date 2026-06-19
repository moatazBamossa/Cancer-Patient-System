import { supabase } from '../../../lib/supabaseClient';
import type {
  RoleDto,
  Role,
  CreateRoleParams,
  UpdateRoleParams,
  GetRolesPaginatedParams,
} from '../types';
import { normalizeRole, normalizeRoles } from '../utils/role-normalizer';

function safePermissionsInput(p?: unknown) {
  return p ?? null;
}

export const roleService = {
  async create_role(params: CreateRoleParams): Promise<Role> {
    const { data, error } = await supabase.rpc('create_role', { p_role_name: params.role_name, p_permissions: safePermissionsInput(params.permissions) });
    if (error) throw error;
    if (!data) throw new Error('create_role: no data returned');
    return normalizeRole(data as RoleDto);
  },

  async get_roles(): Promise<Role[]> {
    const { data, error } = await supabase.rpc('get_roles');
    if (error) throw error;
    return normalizeRoles((data ?? []) as RoleDto[]);
  },

  async get_role_by_id(roleId: number): Promise<Role | null> {
    const { data, error } = await supabase.rpc('get_role_by_id', { p_role_id: roleId });
    if (error) throw error;
    return data ? normalizeRole(data as RoleDto) : null;
  },

  async get_role_by_name(roleName: string): Promise<Role | null> {
    const { data, error } = await supabase.rpc('get_role_by_name', { p_role_name: roleName });
    if (error) throw error;
    return data ? normalizeRole(data as RoleDto) : null;
  },

  async get_roles_paginated(params: GetRolesPaginatedParams): Promise<Role[]> {
    const { limit = 10, offset = 0 } = params || {};
    const { data, error } = await supabase.rpc('get_roles_paginated', { p_limit: limit, p_offset: offset });
    if (error) throw error;
    return normalizeRoles((data ?? []) as RoleDto[]);
  },

  async update_role(params: UpdateRoleParams): Promise<Role> {
    const { data, error } = await supabase.rpc('update_role', { p_role_id: params.role_id, p_role_name: params.role_name ?? null, p_permissions: safePermissionsInput(params.permissions) });
    if (error) throw error;
    if (!data) throw new Error('update_role: no data returned');
    return normalizeRole(data as RoleDto);
  },

  async delete_role(roleId: number | string): Promise<void> {
    const { error } = await supabase.rpc('delete_role', { p_role_id: roleId });
    if (error) throw error;
  },
};
