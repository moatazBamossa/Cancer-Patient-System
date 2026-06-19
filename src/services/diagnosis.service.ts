import type { Diagnosis, Staging, DiagnosisDoctorHistory, CancerType, PaginationParams, PaginatedResponse } from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';
import { rpcCall } from '../utils/rpcCall';

export const diagnosisService = {
  async getAll(params: PaginationParams): Promise<PaginatedResponse<Diagnosis>> {
    const data = await rpcCall<any>('diagnosis_list_all', {});

    let diags: Diagnosis[] = [];
    if (data && data.diagnoses) {
      diags = data.diagnoses;
    } else if (Array.isArray(data)) {
      if (data.length > 0 && data[0].diagnosis_list_all) {
        diags = data[0].diagnosis_list_all.diagnoses || data[0].diagnosis_list_all || [];
      } else {
        diags = data;
      }
    } else if (data?.diagnosis_list_all) {
      diags = data.diagnosis_list_all.diagnoses || data.diagnosis_list_all || [];
    }

    const total = diags.length;
    const startIndex = (params.page - 1) * params.pageSize;
    const endIndex = startIndex + params.pageSize;

    return {
      data: diags.slice(startIndex, endIndex),
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize)
    };
  },

  async getByPatientName(p_search: string): Promise<Diagnosis[]> {
    const data = await rpcCall<any>('diagnosis_list_by_patient', {
      p_search,
    });
    // The RPC might return { success: true, diagnoses: [...] } or an array directly
    if (data && data.diagnoses) return data.diagnoses;
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].diagnosis_list_by_patient) {
         return data[0].diagnosis_list_by_patient.diagnoses || [];
      }
      return data;
    }
    return [];
  },

  async getByPatientID(p_patient_id: number): Promise<Diagnosis[]> {
    const data = await rpcCall<any>('diagnosis_list_by_patientid', {
      p_patient_id,
    });
    // The RPC might return { success: true, diagnoses: [...] } or an array directly
    if (data && data.diagnoses) return data.diagnoses;
    return [];
  },

  async getByPatientID_doctor(p_patient_id: number, p_supervising_doctor_id: number): Promise<Diagnosis[]> {
    const data = await rpcCall<any>('diagnosis_list_by_patient_and_doctor', {
      p_patient_id,
      p_supervising_doctor_id
    });
    // The RPC might return { success: true, diagnoses: [...] } or an array directly
    if (data && data.diagnoses) return data.diagnoses;
    return [];
  },


  async getById(id: string): Promise<Diagnosis> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const diagnosis = store.diagnoses.find((d) => d.diagnosis_id === id);
      if (!diagnosis) throw new Error('Diagnosis not found');
      return diagnosis;
    });
  },

  async create(data: Omit<Diagnosis, 'diagnosis_id' | 'created_at' | 'updated_at'>): Promise<Diagnosis> {
    const response = await rpcCall<any>("diagnosis_create", {
      p_patient_id: Number(data.patient_id),
      p_cancer_id: Number(data.cancer_id),
      p_supervising_doctor_id: Number(data.supervising_doctor_id),
      p_diagnosis_date: data.diagnosis_date,
      p_notes: data.notes,
      p_status: data.status,
    });
    return response as Diagnosis;
  },

  async update(id: string, updates: Partial<Diagnosis>): Promise<Diagnosis> {
    const response = await rpcCall<any>("diagnosis_update", {
      p_diagnosis_id: Number(id),
      p_cancer_id: Number(updates.cancer_id),
      p_supervising_doctor_id: Number(updates.supervising_doctor_id),
      p_diagnosis_date: updates.diagnosis_date,
      p_notes: updates.notes,
      p_status: updates.status,
    });
    return response as Diagnosis;
  },

  async delete(id: string): Promise<void> {
    await rpcCall<any>("diagnosis_delete", {
      p_diagnosis_id: Number(id),
    });
  },

  async getStaging(diagnosisId: string): Promise<Staging[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.staging.filter((s) => s.diagnosis_id === diagnosisId);
    });
  },

  async addStaging(data: Omit<Staging, 'staging_id' | 'created_at'>): Promise<Staging> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const staging: Staging = { ...data, staging_id: generateId('stg'), created_at: new Date().toISOString() };
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

  async addDoctorHistory(data: Omit<DiagnosisDoctorHistory, 'history_id'>): Promise<DiagnosisDoctorHistory> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const history: DiagnosisDoctorHistory = { ...data, history_id: generateId('ddh') };
      store.diagnosis_doctor_history.push(history);
      return history;
    });
  },

  // Cancer Types
  async getCancerTypes(): Promise<CancerType[]> {
    const data = await rpcCall<any>('cancer_list_all', {});
    if (data && data.cancers) return data.cancers;
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].cancer_list_all) {
        return data[0].cancer_list_all.cancers || data[0].cancer_list_all || [];
      }
      return data;
    }
    return [];
  },

  async searchCancerTypes(search: string): Promise<CancerType[]> {
    const data = await rpcCall<any>('cancer_search_by_name', {
      p_search: search,
    });
    if (data && data.cancers) return data.cancers;
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].cancer_search_by_name) {
        return data[0].cancer_search_by_name.cancers || data[0].cancer_search_by_name || [];
      }
      return data;
    }
    return [];
  },

  async addCancerType(data: Omit<CancerType, 'cancer_id'>): Promise<CancerType> {
    const response = await rpcCall<any>("cancer_create", {
      p_cancer_name: data.cancer_name,
      p_color: data.color,
      p_icd10_code: data.icd10_code,
      p_description: data.description,
    });
    return response as CancerType;
  },

  async updateCancerType(id: number, updates: Partial<CancerType>): Promise<CancerType> {
    const response = await rpcCall<any>("cancer_update", {
      p_cancer_id: id,
      p_cancer_name: updates.cancer_name,
      p_color: updates.color,
      p_icd10_code: updates.icd10_code,
      p_description: updates.description,
    });
    return response as CancerType;
  },

  async deleteCancerType(id: number): Promise<void> {
    await rpcCall<any>("cancer_delete", {
      p_cancer_id: id,
    });
  },
};
