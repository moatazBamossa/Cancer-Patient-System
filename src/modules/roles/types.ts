export interface PermissionActions {
  create: boolean;
  list: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissions {
  patient: PermissionActions;
  patient_visits: PermissionActions;
  diagnoses: PermissionActions;
  cancer_types: PermissionActions;
  treatment_plans: PermissionActions;
  clinic_visits_and_vitals: PermissionActions;
  medications: PermissionActions;
  laboratory_tests: PermissionActions;
  imaging_reports: PermissionActions;
  doctor: PermissionActions;
  clinics: PermissionActions;
  visits: PermissionActions;
  roles: PermissionActions;
  user_management: PermissionActions;
  dashboard: boolean;
}

export interface RoleDto {
  role_id: number | string;
  role_name: string;
  permissions?: Partial<RolePermissions> | null;
}

export interface Role {
  role_id: number | string;
  role_name: string;
  permissions: RolePermissions;
}

export interface CreateRoleParams {
  role_name: string;
  permissions?: RolePermissions | null;
}

export interface UpdateRoleParams {
  role_id: number | string;
  role_name?: string | null;
  permissions?: RolePermissions | null;
}

export interface DeleteRoleParams {
  role_id: number | string;
}

export interface GetRolesPaginatedParams {
  limit?: number;
  offset?: number;
}
