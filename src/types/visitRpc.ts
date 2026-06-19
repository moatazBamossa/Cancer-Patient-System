// ─── Clinic Visit & Vital Signs RPC Types ─────────────────────────────────────

export interface ClinicVisitRpcItem {
  visit_id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis_id: number | null;
  visit_date: string;
  visit_type?: string;
  reason_for_visit: string;
  clinical_notes?: string;
  recommendations?: string;
  next_visit_date?: string;
  created_at?: string;
  // Join fields that might be returned
  doctor_name?: string;
  patient_name?: string;
}

export interface VitalSignRpcItem {
  vital_id: number;
  visit_id: number;
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
  recorded_at?: string;
}

// ─── Payload Wrappers ─────────────────────────────────────────────────────────

export interface ClinicVisitListPayload {
  success?: boolean;
  message?: string;
  visits?: ClinicVisitRpcItem[];
}

export interface ClinicVisitMutationPayload {
  success?: boolean;
  message?: string;
  visit?: ClinicVisitRpcItem;
}

export interface VitalSignListPayload {
  success?: boolean;
  message?: string;
  vitals?: VitalSignRpcItem[];
}

export interface VitalSignMutationPayload {
  success?: boolean;
  message?: string;
  vital?: VitalSignRpcItem;
}

// ─── Input Types for Clinic Visits ────────────────────────────────────────────

export interface ClinicVisitCreateInput {
  p_patient_id: number;
  p_doctor_id: number;
  p_diagnosis_id?: number | null;
  p_visit_date: string;
  p_visit_type?: string;
  p_reason_for_visit: string;
  p_clinical_notes?: string;
  p_recommendations?: string;
  p_next_visit_date?: string | null;
}

export interface ClinicVisitUpdateInput {
  p_visit_id: number;
  p_patient_id: number;
  p_doctor_id: number;
  p_diagnosis_id?: number | null;
  p_visit_date: string;
  p_visit_type?: string;
  p_reason_for_visit: string;
  p_clinical_notes?: string;
  p_recommendations?: string;
  p_next_visit_date?: string | null;
}

// ─── Input Types for Vital Signs ──────────────────────────────────────────────

export interface VitalSignCreateInput {
  p_visit_id: number;
  p_temperature?: number | null;
  p_blood_pressure_sys?: number | null;
  p_blood_pressure_dia?: number | null;
  p_heart_rate?: number | null;
  p_respiratory_rate?: number | null;
  p_spo2?: number | null;
  p_weight_kg?: number | null;
  p_height_cm?: number | null;
  p_notes?: string | null;
}

export interface VitalSignUpdateInput {
  p_vital_id: number;
  p_visit_id: number;
  p_temperature?: number | null;
  p_blood_pressure_sys?: number | null;
  p_blood_pressure_dia?: number | null;
  p_heart_rate?: number | null;
  p_respiratory_rate?: number | null;
  p_spo2?: number | null;
  p_weight_kg?: number | null;
  p_height_cm?: number | null;
  p_notes?: string | null;
}

// ─── Input Type for Combined RPC ──────────────────────────────────────────────

export interface ClinicVisitWithVitalsCreateInput {
  p_patient_id: number;
  p_doctor_id: number;
  p_diagnosis_id?: number | null;
  p_visit_date: string;
  p_visit_type?: string;
  p_reason_for_visit: string;
  p_clinical_notes?: string;
  p_recommendations?: string;
  p_next_visit_date?: string | null;
  p_temperature?: number | null;
  p_blood_pressure_sys?: number | null;
  p_blood_pressure_dia?: number | null;
  p_heart_rate?: number | null;
  p_respiratory_rate?: number | null;
  p_spo2?: number | null;
  p_weight_kg?: number | null;
  p_height_cm?: number | null;
  p_bmi?: number | null;
  p_vital_notes?: string | null;
}

// ─── Filters for upcoming visits RPC (dual date ranges) ───────────────────────
export interface ClinicVisitsUpcomingFilters {
  p_from_visit_date?: string | null;
  p_to_visit_date?: string | null;
  p_from_next_date?: string | null;
  p_to_next_date?: string | null;
  p_doctor_id?: number | null;
  p_diagnosis_id?: number | null;
  p_patient_id?: number | null;
}
