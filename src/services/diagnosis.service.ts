import type { Diagnosis, Staging, DiagnosisDoctorHistory, CancerType, PaginationParams, PaginatedResponse } from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';

export const diagnosisService = {
  async getAll(params: PaginationParams): Promise<PaginatedResponse<Diagnosis>> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return paginateData(
        store.diagnoses as unknown as Record<string, unknown>[],
        params,
        ['notes', 'status'] as never[]
      ) as unknown as PaginatedResponse<Diagnosis>;
    });
  },

  async getByPatientId(patientId: string): Promise<Diagnosis[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.diagnoses.filter((d) => d.patient_id === patientId);
    });
  },

  async getById(id: string): Promise<Diagnosis> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const diagnosis = store.diagnoses.find((d) => d.id === id);
      if (!diagnosis) throw new Error('Diagnosis not found');
      return diagnosis;
    });
  },

  async create(data: Omit<Diagnosis, 'id' | 'created_at'>): Promise<Diagnosis> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const diagnosis: Diagnosis = {
        ...data,
        id: generateId('diag'),
        created_at: new Date().toISOString(),
      };
      store.diagnoses.push(diagnosis);
      return diagnosis;
    });
  },

  async update(id: string, updates: Partial<Diagnosis>): Promise<Diagnosis> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.diagnoses.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error('Diagnosis not found');
      store.diagnoses[idx] = { ...store.diagnoses[idx], ...updates };
      return store.diagnoses[idx];
    });
  },

  async getStaging(diagnosisId: string): Promise<Staging[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.staging.filter((s) => s.diagnosis_id === diagnosisId);
    });
  },

  async addStaging(data: Omit<Staging, 'id'>): Promise<Staging> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const staging: Staging = { ...data, id: generateId('stg') };
      store.staging.push(staging);
      return staging;
    });
  },

  async getDoctorHistory(diagnosisId: string): Promise<DiagnosisDoctorHistory[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.diagnosis_doctor_history.filter((h) => h.diagnosis_id === diagnosisId);
    });
  },

  async addDoctorHistory(data: Omit<DiagnosisDoctorHistory, 'id'>): Promise<DiagnosisDoctorHistory> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const history: DiagnosisDoctorHistory = { ...data, id: generateId('ddh') };
      store.diagnosis_doctor_history.push(history);
      return history;
    });
  },

  // Cancer Types
  async getCancerTypes(): Promise<CancerType[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.cancer_types;
    });
  },

  async addCancerType(data: Omit<CancerType, 'id' | 'created_at'>): Promise<CancerType> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const ct: CancerType = {
        ...data,
        id: generateId('ct'),
        created_at: new Date().toISOString(),
      };
      store.cancer_types.push(ct);
      return ct;
    });
  },

  async updateCancerType(id: string, updates: Partial<CancerType>): Promise<CancerType> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.cancer_types.findIndex((ct) => ct.id === id);
      if (idx === -1) throw new Error('Cancer type not found');
      store.cancer_types[idx] = { ...store.cancer_types[idx], ...updates };
      return store.cancer_types[idx];
    });
  },
};
