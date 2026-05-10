// ============================================================
// Cancer Center Management System — Type Definitions
// Aligned with PostgreSQL / Supabase schema
// ============================================================

// ─── TABLE: roles ───────────────────────────────────────────
export interface Role {
  role_id: string;
  role_name: string;
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
  cancer_id: string;
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

export interface ImagingReport {
  image_id: string;
  patient_id: string;
  diagnosis_id: string | null;
  ordered_by: string;
  imaging_type: ImagingType;
  body_part: string;
  report_text: string;
  findings: string;
  impression: string;
  imaging_date: string;
  created_at: string;
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
