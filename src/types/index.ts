// ============================================================
// Cancer Center Management System — Type Definitions
// Aligned with PostgreSQL / Supabase schema
// ============================================================

// ─── TABLE: roles ───────────────────────────────────────────
import type { RolePermissions } from '../modules/roles/types';

export interface Role {
  role_id: string;
  role_name: string;
  permissions?: RolePermissions;
}

// ─── TABLE: user_profiles ───────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  role_id: string;
  specialty: string;
  phone: string;
  user_name: string;
  password: string; // hashed — NEVER display
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role_name?: string;
}

// ─── TABLE: patients ────────────────────────────────────────
export type PatientStatus = 'active' | 'deceased' | 'transferred';
export type Gender = 'male' | 'female';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
  patient_id: string;
  national_id: string;
  full_name: string;
  birth_date: string;
  gender: Gender;
  phone: string;
  mobile_number: string;
  address: string;
  blood_type: BloodType;
  email: string;
  status: PatientStatus;
  nationality: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── TABLE: emergency_contacts ──────────────────────────────
export interface EmergencyContact {
  contact_id: string;
  patient_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  alt_phone: string;
  notes: string;
}

// ─── TABLE: cancer ──────────────────────────────────────────
export interface CancerType {
  cancer_id: number;
  cancer_name: string;
  color: string;
  icd10_code: string;
  description: string;
}

// ─── TABLE: diagnoses ───────────────────────────────────────
export type DiagnosisStatus = 'active' | 'resolved' | 'transferred';

export interface Diagnosis {
  diagnosis_id: string;
  cancer_id: string;
  patient_id: string;
  supervising_doctor_id: string;
  diagnosis_date: string;
  notes: string;
  status: DiagnosisStatus;
  created_at: string;
  updated_at: string;
  // Resolved properties from RPCs
  cancer_name?: string;
  cancer_color?: string;
  doctor_name?: string;
  patient_name?: string;
}

// ─── TABLE: cancer_staging ──────────────────────────────────
export interface Staging {
  staging_id: string;
  diagnosis_id: string;
  t_stage: string;
  n_stage: string;
  m_stage: string;
  final_stage: string;
  grade: string;
  staging_date: string;
  staged_by: string;
  notes: string;
  created_at: string;
}

// ─── TABLE: diagnosis_doctor_history ────────────────────────
export interface DiagnosisDoctorHistory {
  history_id: string;
  diagnosis_id: string;
  doctor_id: string;
  assigned_date: string;
  start_date: string;
  end_date: string | null;
  reason_for_change: string;
  notes: string;
  changed_by: string;
}

// ─── TABLE: clinics ─────────────────────────────────────────
export interface Clinic {
  clinic_id: string;
  clinic_name: string;
  address: string;
  phone: string;
  created_at: string;
}

/** Clinic record returned by Supabase clinic RPCs. */
export interface ClinicListItem {
  clinic_id: number;
  clinic_name: string;
  address: string;
  phone: string;
  created_at: string;
}

export interface ClinicRpcPayload {
  success: boolean;
  message: string;
  clinics?: ClinicListItem[];
}

export interface ClinicMutationPayload {
  success: boolean;
  message: string;
  clinic?: ClinicListItem;
}

export type ClinicFormInput = Omit<Clinic, 'clinic_id' | 'created_at'>;

// ─── TABLE: doctors ─────────────────────────────────────────
export interface Doctor {
  doctor_id: string;
  full_name: string;
  specialty: string;
  clinic_id: string;
  license_number: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Doctor record returned by Supabase doctor RPCs (includes clinic name). */
export interface DoctorListItem {
  doctor_id: number;
  full_name: string;
  specialty: string;
  clinic_id: number;
  clinic_name: string;
  license_number: string;
  phone: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorRpcPayload {
  success: boolean;
  message: string;
  doctors?: DoctorListItem[];
}

export interface DoctorMutationPayload {
  success: boolean;
  message: string;
  doctor?: DoctorListItem;
}

export type DoctorFormInput = Omit<Doctor, 'doctor_id' | 'created_at' | 'updated_at'> & {
  clinic_name?: string;
};

// ─── TABLE: medications ─────────────────────────────────────
export type MedicationCategory = 'chemo' | 'hormonal' | 'supportive';

export interface Medication {
  medication_id: string;
  name: string;
  category: MedicationCategory;
  unit: string;
  description: string;
  is_active: boolean;
}

// ─── TABLE: treatment_plans ─────────────────────────────────
export type TreatmentStatus = 'ongoing' | 'completed' | 'cancelled' | 'on-hold';
export type PlanType = 'Chemotherapy' | 'Radiation' | 'Surgery' | 'Palliative';
export type TreatmentGoal = 'Curative' | 'Palliative' | 'Preventive';

export interface TreatmentPlan {
  plan_id: string;
  diagnosis_id: string;
  treating_doctor_id: string;
  plan_type: PlanType;
  protocol_name: string;
  treatment_goal: TreatmentGoal;
  priority: 'urgent' | 'high' | 'normal';
  start_date: string;
  expected_end_date: string;
  end_date: string | null;
  total_cycles: number;
  status: TreatmentStatus;
  response_status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ─── TABLE: treatment_cycle ─────────────────────────────────
export type CycleStatus = 'scheduled' | 'completed' | 'skipped' | 'delayed';

export interface TreatmentCycle {
  cycle_id: string;
  plan_id: string;
  cycle_number: number;
  cycle_date: string;
  status: CycleStatus;
  side_effects: string;
  progress_notes: string;
  administered_by: string;
  created_at: string;
}

// ─── TABLE: cycle_medications ───────────────────────────────
export interface CycleMedication {
  id: string;
  cycle_id: string;
  medication_id: string;
  dose: number;
  dose_unit: string;
  route: string;
  frequency: string;
  note: string;
}

// ─── TABLE: vital_signs ─────────────────────────────────────
export interface VitalSigns {
  vital_id: string;
  cycle_id: string | null;
  visit_id: string | null;
  recorded_by: string;
  recorded_at: string;
  temperature: number;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  heart_rate: number;
  respiratory_rate: number;
  spo2: number;
  weight_kg: number;
  height_cm: number;
  bmi: number; // auto-calculated — read only
  notes: string;
}

// ─── TABLE: clinic_visits ───────────────────────────────────
export type VisitType = 'Follow-up' | 'Emergency' | 'Routine' | 'Post-treatment';

export interface ClinicVisit {
  visit_id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis_id: string | null;
  visit_date: string;
  visit_type: VisitType;
  reason_for_visit: string;
  clinical_notes: string;
  recommendations: string;
  next_visit_date: string;
  created_at: string;
}

// ─── TABLE: lab_test ────────────────────────────────────────
export interface LabTest {
  lab_test_id: string;
  test_name: string;
  category: string;
  units: string;
  normal_range: string;
  description: string;
}

// ─── TABLE: lab_test_patient ────────────────────────────────
export interface LabTestResult {
  lab_test_patient_id: string;
  patient_id: string;
  lab_test_id: string;
  cycle_id: string | null;
  visit_id: string | null;
  result_value: string;
  is_abnormal: boolean;
  test_date: string;
  ordered_by: string;
  notes: string;
}

// ─── TABLE: imaging_reports ─────────────────────────────────
export type ImagingType = 'CT' | 'MRI' | 'PET' | 'X-Ray' | 'Ultrasound';

export interface ImagingReportPatient {
  patient_id: number | string;
  full_name?: string;
  email?: string;
  notes?: string | null;
  phone?: string;
  gender?: string;
  status?: PatientStatus;
  address?: string;
  birth_date?: string;
  blood_type?: BloodType;
  national_id?: string;
  nationality?: string;
  mobile_number?: string;
}

export interface ImagingReportCancer {
  cancer_id?: number | string;
  cancer_name?: string;
  color?: string;
  icd10_code?: string;
  description?: string;
}

export interface ImagingReportDiagnosis {
  diagnosis_id?: number | string;
  diagnosis_date?: string;
  notes?: string;
  status?: string;
  cancer?: ImagingReportCancer;
  cancer_name?: string;
}

export interface ImagingReportDoctor {
  doctor_id?: number | string;
  full_name?: string | null;
  clinic_id?: number | string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  license_number?: string | null;
  is_active?: boolean;
}

export interface ImagingReport {
  image_id: string;
  patient_id: string | number;
  diagnosis_id: string | number | null;
  ordered_by: string | number;
  imaging_type: ImagingType;
  body_part: string;
  report_text: string;
  findings: string;
  impression: string;
  imaging_date: string;
  created_at: string;
  patient?: ImagingReportPatient | null;
  diagnosis?: ImagingReportDiagnosis | null;
  ordered_doctor?: ImagingReportDoctor | null;
  patient_name?: string;
  radiologist_name?: string;
}

export interface ImagingReportRpcItem {
  image_id: number | string;
  patient_id: number | string;
  diagnosis_id?: number | string | null;
  ordered_by: number | string;
  imaging_type: string | null;
  body_part: string | null;
  report_text?: string | null;
  findings?: string | null;
  impression?: string | null;
  imaging_date?: string | null;
  created_at?: string | null;
  patient_name?: string | null;
  radiologist_name?: string | null;
  patient?: ImagingReportPatient | null;
  diagnosis?: ImagingReportDiagnosis | null;
  ordered_doctor?: ImagingReportDoctor | null;
}

export interface ImagingReportsListPayload {
  success?: boolean;
  message?: string;
  imaging_reports?: ImagingReportRpcItem[];
}

export interface ImagingReportMutationPayload {
  success?: boolean;
  message?: string;
  imaging_report?: ImagingReportRpcItem;
}

export interface ImagingReportListFilters {
  p_patient_id?: string | null;
  p_diagnosis_id?: string | null;
  p_doctors_id?: string | null;
  p_imaging_type?: string | null;
  p_from_date?: string | null;
  p_to_date?: string | null;
  p_search?: string | null;
}

export interface ImagingReportCreateInput {
  p_patient_id: string;
  p_diagnosis_id?: string | null;
  p_doctors_id: string;
  p_imaging_type: ImagingType;
  p_body_part: string;
  p_report_text?: string | null;
  p_findings: string;
  p_impression: string;
  p_imaging_date: string;
}

export interface ImagingReportUpdateInput extends ImagingReportCreateInput {
  p_image_id: string;
}

// ============================================================
// API Response Types (unchanged — frontend-only)
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientRpcResponse {
  patient_list: {
    message: string;
    success: boolean;
    patients: Patient[];
  };
}

export type PatientDetailsRpcResponse = {
  get_patient_details?: {
    patient_id: number;
    full_name: string | null;
    national_id: string | null;
    birth_date: string | null;
    gender: string | null;
    blood_type: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: string | null;

    contacts: Array<{
      full_name: string | null;
      relationship: string | null;
      phone: string | null;
      alt_phone: string | null;
      notes: string | null;
    }>;

    diagnoses: Array<{
      diagnosis_id: number;
      diagnosis_date: string | null;
      status: string | null;
      notes: string | null;
      cancer_name: string | null;
      cancer_color: string | null;
      doctor_name: string | null;
    }>;

    treatment_plans: Array<{
      plan_id: number;
      protocol_name: string | null;
      start_date: string | null;
      end_date: string | null;
      status: string | null;
      notes: string | null;
      cycles: Array<{
        cycle_id: number;
        cycle_number: number | null;
        status: string | null;
        cycle_date: string | null;
        side_effects: string | null;
        progress_notes: string | null;
        medications: Array<{
          dose: number | null;
          dose_unit: string | null;
          route: string | null;
          frequency: string | null;
          name: string | null;
          category: MedicationCategory
        }>;
      }>;
    }>;

    vitals: Array<{
      vital_id: number;
      recorded_at: string | null;
      temperature: number | null;
      blood_pressure_sys: number | null;
      blood_pressure_dia: number | null;
      heart_rate: number | null;
      respiratory_rate: number | null;
      spo2: number | null;
      weight_kg: number | null;
      height_cm: number | null;
      bmi: number | null;
      notes: string | null;
    }>;

    lab_results: Array<{
      lab_test_patient_id: number;
      test_date: string | null;
      result_value: string | null;
      is_abnormal: boolean | null;
      notes: string | null;
      test_name: string | null;
      units: string | null;
      normal_range: string | null;
    }>;

    imaging_reports: Array<{
      image_id: number;
      imaging_type: string | null;
      body_part: string | null;
      imaging_date: string | null;
      findings: string | null;
      impression: string | null;
      radiologist_name: string | null;
    }>;

    visits: Array<{
      visit_id: number;
      visit_date: string | null;
      visit_type: string | null;
      reason_for_visit: string | null;
      clinical_notes: string | null;
      recommendations: string | null;
      next_visit_date: string | null;
      doctor_name: string | null;
      diagnosis_summary: {
        cancer_name: string | null;
        doctor_name: string | null;
      } | null;
    }>;
  };
};

// ============================================================
// Mock Data Store Shape
// ============================================================

export interface MockData {
  roles: Role[];
  users: User[];
  patients: Patient[];
  cancer_types: CancerType[];
  diagnoses: Diagnosis[];
  staging: Staging[];
  treatment_plans: TreatmentPlan[];
  treatment_cycles: TreatmentCycle[];
  vital_signs: VitalSigns[];
  medications: Medication[];
  cycle_medications: CycleMedication[];
  lab_tests: LabTest[];
  lab_test_results: LabTestResult[];
  imaging_reports: ImagingReport[];
  emergency_contacts: EmergencyContact[];
  clinics: Clinic[];
  doctors: Doctor[];
  clinic_visits: ClinicVisit[];
  diagnosis_doctor_history: DiagnosisDoctorHistory[];
}

// ============================================================
// Auth Types
// ============================================================

export interface AuthSession {
  user: User;
  role: Role;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export * from './user-profile';
