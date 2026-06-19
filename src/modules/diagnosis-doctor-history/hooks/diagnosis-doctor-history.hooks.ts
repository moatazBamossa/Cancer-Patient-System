import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { diagnosisDoctorHistoryService } from "../services/diagnosis-doctor-history.service"
import { diagnosisDoctorHistoryQueryKeys } from "../queries/diagnosis-doctor-history-query-keys"
import type {
  CreateDiagnosisDoctorHistoryParams,
  UpdateDiagnosisDoctorHistoryParams,
} from "../types"

export function useDiagnosisDoctorHistoryQuery(diagnosisId?: number) {
  return useQuery({
    queryKey: diagnosisId
      ? diagnosisDoctorHistoryQueryKeys.list(diagnosisId)
      : ["diagnosis_doctor_history", "idle", diagnosisId],
    queryFn: async () => {
      if (!diagnosisId) return []
      return diagnosisDoctorHistoryService.diagnosis_doctor_history_list_by_diagnosis(
        diagnosisId,
      )
    },
    enabled: !!diagnosisId,
  })
}

export function useCreateDiagnosisDoctorHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateDiagnosisDoctorHistoryParams) =>
      diagnosisDoctorHistoryService.diagnosis_doctor_history_create(params),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: diagnosisDoctorHistoryQueryKeys.list(vars.diagnosis_id),
      })
    },
  })
}

export function useUpdateDiagnosisDoctorHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: UpdateDiagnosisDoctorHistoryParams) =>
      diagnosisDoctorHistoryService.diagnosis_doctor_history_update(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: diagnosisDoctorHistoryQueryKeys.all })
    },
  })
}

export function useDeleteDiagnosisDoctorHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (historyId: number) =>
      diagnosisDoctorHistoryService.diagnosis_doctor_history_delete(historyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: diagnosisDoctorHistoryQueryKeys.all })
    },
  })
}
