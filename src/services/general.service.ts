import type { LabTest, LabTestResult, ImagingReport, Role, ActivityLog, Notification } from '../types';
import { getDataStore, simulateApiCall } from './mockApi';
import { generateId } from '../lib/utils';

export const labService = {
  async getTests(): Promise<LabTest[]> {
    return simulateApiCall(() => getDataStore().lab_tests);
  },
  async addTest(data: Omit<LabTest, 'id'>): Promise<LabTest> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const test: LabTest = { ...data, id: generateId('lt') };
      store.lab_tests.push(test);
      return test;
    });
  },
  async getResultsByPatient(patientId: string): Promise<LabTestResult[]> {
    return simulateApiCall(() =>
      getDataStore().lab_test_results.filter((r) => r.patient_id === patientId)
    );
  },
  async addResult(data: Omit<LabTestResult, 'id'>): Promise<LabTestResult> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const result: LabTestResult = { ...data, id: generateId('ltr') };
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
  async create(data: Omit<ImagingReport, 'id'>): Promise<ImagingReport> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const report: ImagingReport = { ...data, id: generateId('img') };
      store.imaging_reports.push(report);
      return report;
    });
  },
};

export const roleService = {
  async getAll(): Promise<Role[]> {
    return simulateApiCall(() => getDataStore().roles);
  },
  async create(data: Omit<Role, 'id' | 'created_at'>): Promise<Role> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const role: Role = { ...data, id: generateId('role'), created_at: new Date().toISOString() };
      store.roles.push(role);
      return role;
    });
  },
  async update(id: string, updates: Partial<Role>): Promise<Role> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.roles.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error('Role not found');
      store.roles[idx] = { ...store.roles[idx], ...updates };
      return store.roles[idx];
    });
  },
  async remove(id: string): Promise<void> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.roles.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error('Role not found');
      store.roles.splice(idx, 1);
    });
  },
};

export const activityService = {
  async getAll(): Promise<ActivityLog[]> {
    return simulateApiCall(() =>
      getDataStore()
        .activity_logs.slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
  },
  async getRecent(limit: number): Promise<ActivityLog[]> {
    return simulateApiCall(() =>
      getDataStore()
        .activity_logs.slice()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    );
  },
};

export const notificationService = {
  async getByUser(userId: string): Promise<Notification[]> {
    return simulateApiCall(() =>
      getDataStore()
        .notifications.filter((n) => n.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    );
  },
  async markAsRead(id: string): Promise<void> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.notifications.findIndex((n) => n.id === id);
      if (idx !== -1) store.notifications[idx].is_read = true;
    });
  },
};
