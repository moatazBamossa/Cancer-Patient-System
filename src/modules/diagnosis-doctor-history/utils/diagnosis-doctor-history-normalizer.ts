import type { DiagnosisDoctorHistoryDto, DiagnosisDoctorHistory } from '../types';

export function normalizeDiagnosisDoctorHistory(item: DiagnosisDoctorHistoryDto): DiagnosisDoctorHistory {
  return { ...item };
}

export function normalizeDiagnosisDoctorHistories(items: DiagnosisDoctorHistoryDto[]): DiagnosisDoctorHistory[] {
  return items.map(normalizeDiagnosisDoctorHistory);
}
