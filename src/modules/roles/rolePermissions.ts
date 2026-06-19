export const ROLE_PERMISSION_MODULES = [
  'patient',
  'patient_visits',
  'diagnoses',
  'cancer_types',
  'treatment_plans',
  'clinic_visits_and_vitals',
  'medications',
  'laboratory_tests',
  'imaging_reports',
  'doctor',
  'clinics',
  'visits',
  'roles',
  'user_management',
  'dashboard',
] as const;

export const ROLE_PERMISSION_ACTIONS = ['create', 'list', 'update', 'delete'] as const;

export type RolePermissionModule = (typeof ROLE_PERMISSION_MODULES)[number];
export type RolePermissionAction = (typeof ROLE_PERMISSION_ACTIONS)[number];

export function emptyPermissionActions(): { create: boolean; list: boolean; update: boolean; delete: boolean } {
  return { create: false, list: false, update: false, delete: false };
}

export function defaultRolePermissions() {
  const obj: Record<string, { create: boolean; list: boolean; update: boolean; delete: boolean }> = {};
  for (const m of ROLE_PERMISSION_MODULES) {
    obj[m] = emptyPermissionActions();
  }
  return obj as Record<RolePermissionModule, { create: boolean; list: boolean; update: boolean; delete: boolean }>;
}

export const READ_ONLY = { create: false, list: true, update: false, delete: false } as const;
export const FULL_ACCESS = { create: true, list: true, update: true, delete: true } as const;

/** Maps route paths to their permission module. Used by route guards and sidebar filtering. */
export const ROUTE_MODULE_MAP: Record<string, RolePermissionModule> = {
  '/': 'dashboard',
  '/patients': 'patient',
  '/patient-visits': 'patient_visits',
  '/diagnoses': 'diagnoses',
  '/cancer-types': 'cancer_types',
  '/treatment-plans': 'treatment_plans',
  '/vitals': 'clinic_visits_and_vitals',
  '/medications': 'medications',
  '/lab-tests': 'laboratory_tests',
  '/imaging': 'imaging_reports',
  '/doctors': 'doctor',
  '/clinics': 'clinics',
  '/visits': 'visits',
  '/roles': 'roles',
  '/users': 'user_management',
};
