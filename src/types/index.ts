// ============================================================
// Cancer Center Management System - Type Definitions
// ============================================================

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  full_name: string;
  role_id: string;
  avatar: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export type PatientStatus = 'active' | 'inactive' | 'discharged';
export type Gender = 'male' | 'female';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
  id: string;
  national_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  blood_type: BloodType;
  phone: string;
  email: string;
  address: string;
  status: PatientStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CancerType {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  created_at: string;
}

export type DiagnosisStatus = 'confirmed' | 'suspected' | 'resolved';

export interface Diagnosis {
  id: string;
  patient_id: string;
  cancer_type_id: string;
  doctor_id: string;
  diagnosis_date: string;
  notes: string;
  status: DiagnosisStatus;
  created_at: string;
}

export interface Staging {
  id: string;
  diagnosis_id: string;
  stage: string;
  t_stage: string;
  n_stage: string;
  m_stage: string;
  grading: string;
  date_assessed: string;
  notes: string;
}

export type TreatmentStatus = 'ongoing' | 'completed' | 'stopped' | 'planned';

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  diagnosis_id: string;
  doctor_id: string;
  title: string;
  description: string;
  status: TreatmentStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export type CycleStatus = 'completed' | 'in_progress' | 'planned' | 'cancelled';

export interface TreatmentCycle {
  id: string;
  treatment_plan_id: string;
  cycle_number: number;
  start_date: string;
  end_date: string | null;
  status: CycleStatus;
  notes: string;
}

export interface VitalSigns {
  id: string;
  patient_id: string;
  recorded_at: string;
  temperature: number;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate: number;
  respiratory_rate: number;
  oxygen_saturation: number;
  weight: number;
  height: number;
  recorded_by: string;
}

export type MedicationCategory = 'chemo' | 'hormonal' | 'supportive';

export interface Medication {
  id: string;
  name: string;
  generic_name: string;
  category: MedicationCategory;
  dosage_form: string;
  standard_dose: string;
  side_effects: string;
  created_at: string;
}

export interface CycleMedication {
  id: string;
  cycle_id: string;
  medication_id: string;
  dose: string;
  frequency: string;
  route: string;
  start_date: string;
  end_date: string;
}

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  normal_range_min: number | null;
  normal_range_max: number | null;
  description: string;
}

export type LabResultStatus = 'normal' | 'low' | 'high' | 'critical';

export interface LabTestResult {
  id: string;
  patient_id: string;
  lab_test_id: string;
  value: number;
  date: string;
  status: LabResultStatus;
  notes: string;
  ordered_by: string;
}

export type ImagingType = 'CT Scan' | 'MRI' | 'PET-CT' | 'X-Ray' | 'Ultrasound' | 'Mammogram';

export interface ImagingReport {
  id: string;
  patient_id: string;
  type: string;
  body_part: string;
  date: string;
  findings: string;
  impression: string;
  radiologist: string;
  status: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  location: string;
  phone: string;
  operating_hours: string;
  is_active: boolean;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  clinic_id: string;
  years_of_experience: number;
  qualifications: string;
  is_active: boolean;
  created_at: string;
}

export type VisitType = 'Initial Consultation' | 'Follow-up' | 'Treatment' | 'Emergency';

export interface ClinicVisit {
  id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string;
  notes: string;
  status: string;
}

export interface DiagnosisDoctorHistory {
  id: string;
  diagnosis_id: string;
  doctor_id: string;
  start_date: string;
  end_date: string | null;
  reason: string;
  is_current: boolean;
}

export type ActivityAction = 'login' | 'create' | 'update' | 'delete';

export interface ActivityLog {
  id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string | null;
  description: string;
  timestamp: string;
}

export type NotificationType = 'info' | 'warning' | 'alert' | 'critical';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

// ============================================================
// API Response Types
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
// All Data from JSON
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
  activity_logs: ActivityLog[];
  notifications: Notification[];
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
