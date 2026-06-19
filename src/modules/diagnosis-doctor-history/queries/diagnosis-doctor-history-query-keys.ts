export const diagnosisDoctorHistoryQueryKeys = {
  all: ['diagnosis_doctor_history'] as const,

  list: (diagnosisId: number) => [...diagnosisDoctorHistoryQueryKeys.all, diagnosisId] as const,

  detail: (historyId: number) => [...diagnosisDoctorHistoryQueryKeys.all, 'detail', historyId] as const,
};
