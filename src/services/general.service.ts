import type { LabTest, LabTestResult, Role } from '../types';
import { getDataStore, simulateApiCall } from './mockApi';
import { generateId } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { rpcCall } from '../utils/rpcCall';

export const labService = {
  async getTests(): Promise<LabTest[]> {
    const { data, error } = await supabase.from('lab_test').select('*');
    if (error) throw new Error(error.message);
    return (data as LabTest[]) ?? [];
  },
  async addTest(data: Omit<LabTest, 'lab_test_id'>): Promise<LabTest> {
    return rpcCall<LabTest>('lab_test_create', {
      p_test_name: data.test_name,
      p_category: data.category,
      p_units: data.units,
      p_normal_range: data.normal_range,
      p_description: data.description,
    });
  },
  async updateTest(id: string, data: Omit<LabTest, 'lab_test_id'>): Promise<LabTest> {
    return rpcCall<LabTest>('lab_test_update', {
      p_lab_test_id: id,
      p_test_name: data.test_name,
      p_category: data.category,
      p_units: data.units,
      p_normal_range: data.normal_range,
      p_description: data.description,
    });
  },
  async getResults(): Promise<LabTestResult[]> {
    const { data, error } = await supabase.from('lab_test_patient').select('*');
    if (error) throw new Error(error.message);
    return (data as LabTestResult[]) ?? [];
  },
  async getResultsByPatient(patientId: string): Promise<LabTestResult[]> {
    const { data, error } = await supabase.from('lab_test_patient').select('*').eq('patient_id', patientId);
    if (error) throw new Error(error.message);
    return (data as LabTestResult[]) ?? [];
  },
  async addResult(data: Omit<LabTestResult, 'lab_test_patient_id'>): Promise<LabTestResult> {
    return rpcCall<LabTestResult>('lab_test_patient_create', {
      p_patient_id: data.patient_id,
      p_lab_test_id: data.lab_test_id,
      p_cycle_id: data.cycle_id,
      p_visit_id: data.visit_id,
      p_result_value: data.result_value,
      p_is_abnormal: data.is_abnormal,
      p_test_date: data.test_date,
      p_ordered_by: data.ordered_by,
      p_notes: data.notes ?? null,
    });
  },
  async updateResult(data: LabTestResult): Promise<LabTestResult> {
    return rpcCall<LabTestResult>('lab_test_patient_update', {
      p_lab_test_patient_id: data.lab_test_patient_id,
      p_patient_id: data.patient_id,
      p_lab_test_id: data.lab_test_id,
      p_cycle_id: data.cycle_id,
      p_visit_id: data.visit_id,
      p_result_value: data.result_value,
      p_is_abnormal: data.is_abnormal,
      p_test_date: data.test_date,
      p_ordered_by: data.ordered_by,
      p_notes: data.notes ?? null,
    });
  },
};

export const roleService = {
  async getAll(): Promise<Role[]> {
    return simulateApiCall(() => getDataStore().roles);
  },
  async create(data: Omit<Role, 'role_id'>): Promise<Role> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const role: Role = { ...data, role_id: generateId('role') };
      store.roles.push(role);
      return role;
    });
  },
  async update(id: string, updates: Partial<Role>): Promise<Role> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.roles.findIndex((r) => r.role_id === id);
      if (idx === -1) throw new Error('Role not found');
      store.roles[idx] = { ...store.roles[idx], ...updates };
      return store.roles[idx];
    });
  },
  async remove(id: string): Promise<void> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.roles.findIndex((r) => r.role_id === id);
      if (idx === -1) throw new Error('Role not found');
      store.roles.splice(idx, 1);
    });
  },
};
