export interface TreatmentPlanRpcItem {
  plan_id: number;
  diagnosis_id: number;
  treating_doctor_id: number;
  plan_type: string;
  protocol_name: string;
  treatment_goal: string;
  priority: string;
  start_date: string;
  expected_end_date?: string | null;
  end_date?: string | null;
  total_cycles: number;
  status: string;
  response_status?: string | null;
  notes?: string | null;
  doctor_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TreatmentCycleRpcItem {
  cycle_id: number;
  plan_id: number;
  cycle_number: number;
  cycle_date: string;
  status: string;
  side_effects?: string | null;
  progress_notes?: string | null;
  administered_by?: number | null;
  administered_by_name?: string | null;
  created_at?: string;
}

export interface CycleMedicationRpcItem {
  id: number;
  cycle_id: number;
  medication_id: number;
  medication_name?: string | null;
  medication_category?: string | null;
  dose: number;
  dose_unit: string;
  route: string;
  frequency: string;
  note?: string | null;
}

export interface TreatmentPlansListPayload {
  success?: boolean;
  message?: string;
  plans?: TreatmentPlanRpcItem[];
}

export interface TreatmentCyclesListPayload {
  success?: boolean;
  message?: string;
  cycles?: TreatmentCycleRpcItem[];
}

export interface CycleMedicationsListPayload {
  success?: boolean;
  message?: string;
  cycle_medications?: CycleMedicationRpcItem[];
}

export interface TreatmentPlanCreateInput {
  p_diagnosis_id: number;
  p_treating_doctor_id: number;
  p_plan_type: string;
  p_protocol_name: string;
  p_treatment_goal: string;
  p_priority: string;
  p_start_date: string;
  p_expected_end_date?: string;
  p_total_cycles: number;
  p_status: string;
  p_response_status?: string;
  p_notes?: string;
}

export interface TreatmentPlanUpdateInput extends TreatmentPlanCreateInput {
  p_plan_id: number;
}

export interface TreatmentCycleCreateInput {
  p_plan_id: number;
  p_cycle_number: number;
  p_cycle_date: string;
  p_status: string;
  p_side_effects?: string;
  p_progress_notes?: string;
  p_administered_by?: number;
}

export interface TreatmentCycleUpdateInput extends TreatmentCycleCreateInput {
  p_cycle_id: number;
}

export interface CycleMedicationCreateInput {
  p_cycle_id: number;
  p_medication_id: number;
  p_dose: number;
  p_dose_unit: string;
  p_route: string;
  p_frequency: string;
  p_note?: string;
}

export interface CycleMedicationUpdateInput extends CycleMedicationCreateInput {
  p_id: number;
}
