import type { Doctor, Clinic, ClinicVisit, PaginationParams, PaginatedResponse } from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';

export const doctorService = {
  // ─── Doctors ──────────────────────────────
  async getAll(): Promise<Doctor[]> {
    return simulateApiCall(() => getDataStore().doctors);
  },

  async getById(id: string): Promise<Doctor> {
    return simulateApiCall(() => {
      const doc = getDataStore().doctors.find((d) => d.id === id);
      if (!doc) throw new Error('Doctor not found');
      return doc;
    });
  },

  async create(data: Omit<Doctor, 'id' | 'created_at'>): Promise<Doctor> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const doc: Doctor = { ...data, id: generateId('doc'), created_at: new Date().toISOString() };
      store.doctors.push(doc);
      return doc;
    });
  },

  async update(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.doctors.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error('Doctor not found');
      store.doctors[idx] = { ...store.doctors[idx], ...updates };
      return store.doctors[idx];
    });
  },

  async getDoctorDiagnoses(doctorId: string) {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.diagnoses.filter((d) => d.doctor_id === doctorId);
    });
  },

  // ─── Clinics ──────────────────────────────
  async getClinics(): Promise<Clinic[]> {
    return simulateApiCall(() => getDataStore().clinics);
  },

  async createClinic(data: Omit<Clinic, 'id' | 'created_at'>): Promise<Clinic> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const clinic: Clinic = { ...data, id: generateId('cln'), created_at: new Date().toISOString() };
      store.clinics.push(clinic);
      return clinic;
    });
  },

  async updateClinic(id: string, updates: Partial<Clinic>): Promise<Clinic> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.clinics.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Clinic not found');
      store.clinics[idx] = { ...store.clinics[idx], ...updates };
      return store.clinics[idx];
    });
  },

  // ─── Clinic Visits ────────────────────────
  async getVisits(
    params: PaginationParams & { doctorId?: string; patientId?: string; date?: string }
  ): Promise<PaginatedResponse<ClinicVisit>> {
    return simulateApiCall(() => {
      const store = getDataStore();
      let visits = [...store.clinic_visits];
      if (params.doctorId) visits = visits.filter((v) => v.doctor_id === params.doctorId);
      if (params.patientId) visits = visits.filter((v) => v.patient_id === params.patientId);
      if (params.date) visits = visits.filter((v) => v.visit_date.startsWith(params.date!));
      return paginateData(
        visits as unknown as Record<string, unknown>[],
        params,
        ['chief_complaint', 'notes', 'visit_type'] as never[]
      ) as unknown as PaginatedResponse<ClinicVisit>;
    });
  },

  async getVisitsByPatient(patientId: string): Promise<ClinicVisit[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.clinic_visits.filter((v) => v.patient_id === patientId);
    });
  },

  async createVisit(data: Omit<ClinicVisit, 'id'>): Promise<ClinicVisit> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const visit: ClinicVisit = { ...data, id: generateId('cv') };
      store.clinic_visits.push(visit);
      return visit;
    });
  },
};
