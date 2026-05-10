import type { LabTest, LabTestResult, ImagingReport, Role } from '../types';
import { getDataStore, simulateApiCall } from './mockApi';
import { generateId } from '../lib/utils';

export const labService = {
  async getTests(): Promise<LabTest[]> {
    return simulateApiCall(() => getDataStore().lab_tests);
  },
  async addTest(data: Omit<LabTest, 'lab_test_id'>): Promise<LabTest> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const test: LabTest = { ...data, lab_test_id: generateId('lt') };
      store.lab_tests.push(test);
      return test;
    });
  },
  async getResultsByPatient(patientId: string): Promise<LabTestResult[]> {
    return simulateApiCall(() =>
      getDataStore().lab_test_results.filter((r) => r.patient_id === patientId)
    );
  },
  async addResult(data: Omit<LabTestResult, 'lab_test_patient_id'>): Promise<LabTestResult> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const result: LabTestResult = { ...data, lab_test_patient_id: generateId('ltr') };
      store.lab_test_results.push(result);
      return result;
    });
  },
};

export const imagingService = {
  async getByPatient(patientId: string): Promise<ImagingReport[]> {
    return simulateApiCall(() =>
      getDataStore().imaging_reports.filter((r) => r.patient_id === patientId)
    );
  },
  async getAll(): Promise<ImagingReport[]> {
    return simulateApiCall(() => getDataStore().imaging_reports);
  },
  async create(data: Omit<ImagingReport, 'image_id' | 'created_at'>): Promise<ImagingReport> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const report: ImagingReport = { ...data, image_id: generateId('img'), created_at: new Date().toISOString() };
      store.imaging_reports.push(report);
      return report;
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
