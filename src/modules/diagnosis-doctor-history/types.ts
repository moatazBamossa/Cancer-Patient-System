export interface DiagnosisDoctorHistoryDto {
  history_id: number;
  diagnosis_id: number;
  doctor_id: number;
  doctor_name: string;
  assigned_date: string;
  start_date: string;
  end_date: string | null;
  reason_for_change: string | null;
  notes: string | null;
  changed_by: string;
  changed_by_name?: string;
}

export interface DiagnosisDoctorHistory {
  history_id: number;
  diagnosis_id: number;
  doctor_id: number;
  doctor_name: string;
  assigned_date: string;
  start_date: string;
  end_date: string | null;
  reason_for_change: string | null;
  notes: string | null;
  changed_by: string;
  changed_by_name?: string;
}

export interface DiagnosisDoctorHistoryResponse {
  success: boolean;
  message: string;
  history: DiagnosisDoctorHistoryDto;
}

export interface DiagnosisDoctorHistoryListResponse {
  success: boolean;
  message: string;
  history: DiagnosisDoctorHistoryDto[];
}

export interface CreateDiagnosisDoctorHistoryParams {
  diagnosis_id: number;
  doctor_id: number;
  start_date: string;
  reason_for_change?: string | null;
  notes?: string | null;
  changed_by: string;
}

export interface UpdateDiagnosisDoctorHistoryParams {
  history_id: number;
  end_date?: string | null;
  reason_for_change?: string | null;
  notes?: string | null;
}

export interface DeleteDiagnosisDoctorHistoryParams {
  history_id: number;
}
