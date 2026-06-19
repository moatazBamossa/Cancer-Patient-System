import { supabase } from "../../../lib/supabaseClient"
import type {
  DiagnosisDoctorHistoryDto,
  DiagnosisDoctorHistory,
  CreateDiagnosisDoctorHistoryParams,
  UpdateDiagnosisDoctorHistoryParams,
} from "../types"
import {
  normalizeDiagnosisDoctorHistory,
  normalizeDiagnosisDoctorHistories,
} from "../utils/diagnosis-doctor-history-normalizer"

export const diagnosisDoctorHistoryService = {
  async diagnosis_doctor_history_create(
    params: CreateDiagnosisDoctorHistoryParams,
  ): Promise<DiagnosisDoctorHistory> {
    const { data, error } = await supabase.rpc(
      "diagnosis_doctor_history_create",
      {
        p_diagnosis_id: params.diagnosis_id,
        p_doctor_id: params.doctor_id,
        p_start_date: params.start_date,
        p_reason_for_change: params.reason_for_change ?? null,
        p_notes: params.notes ?? null,
        p_changed_by: params.changed_by,
      },
    )
    if (error) throw error
    if (!data)
      throw new Error("diagnosis_doctor_history_create: no data returned")
    return normalizeDiagnosisDoctorHistory(data as DiagnosisDoctorHistoryDto)
  },

  async diagnosis_doctor_history_list_by_diagnosis(
    diagnosisId: number,
  ): Promise<DiagnosisDoctorHistory[]> {
    const { data, error } = await supabase.rpc(
      "diagnosis_doctor_history_list_by_diagnosis",
      {
        p_diagnosis_id: diagnosisId,
      },
    )
    if (error) throw error

    return data.history
  },

  async diagnosis_doctor_history_update(
    params: UpdateDiagnosisDoctorHistoryParams,
  ): Promise<DiagnosisDoctorHistory> {
    const { data, error } = await supabase.rpc(
      "diagnosis_doctor_history_update",
      {
        p_history_id: params.history_id,
        p_end_date: params.end_date ?? null,
        p_reason_for_change: params.reason_for_change ?? null,
        p_notes: params.notes ?? null,
      },
    )
    if (error) throw error
    if (!data)
      throw new Error("diagnosis_doctor_history_update: no data returned")
    return normalizeDiagnosisDoctorHistory(data as DiagnosisDoctorHistoryDto)
  },

  async diagnosis_doctor_history_delete(historyId: number): Promise<void> {
    const { error } = await supabase.rpc("diagnosis_doctor_history_delete", {
      p_history_id: historyId,
    })
    if (error) throw error
  },
}
