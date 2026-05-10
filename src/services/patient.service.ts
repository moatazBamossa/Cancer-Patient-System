import type { Patient, PaginationParams, PaginatedResponse, EmergencyContact } from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';

export const patientService = {
  async getAll(params: PaginationParams & { status?: string }): Promise<PaginatedResponse<Patient>> {
    return simulateApiCall(() => {
      const store = getDataStore();
      let patients = [...store.patients];
      if (params.status) {
        patients = patients.filter((p) => p.status === params.status);
      }
      return paginateData(
        patients as unknown as Record<string, unknown>[],
        params,
        ['full_name', 'national_id', 'phone', 'email'] as never[]
      ) as unknown as PaginatedResponse<Patient>;
    });
  },

  async getById(id: string): Promise<Patient> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const patient = store.patients.find((p) => p.patient_id === id);
      if (!patient) throw new Error('Patient not found');
      return patient;
    });
  },

  async create(data: Omit<Patient, 'patient_id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const newPatient: Patient = {
        ...data,
        patient_id: generateId('pat'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.patients.push(newPatient);
      return newPatient;
    });
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.patients.findIndex((p) => p.patient_id === id);
      if (idx === -1) throw new Error('Patient not found');
      store.patients[idx] = {
        ...store.patients[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return store.patients[idx];
    });
  },

  async softDelete(id: string): Promise<void> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.patients.findIndex((p) => p.patient_id === id);
      if (idx === -1) throw new Error('Patient not found');
      store.patients[idx].status = 'deceased';
    });
  },

  async getEmergencyContacts(patientId: string): Promise<EmergencyContact[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.emergency_contacts.filter((ec) => ec.patient_id === patientId);
    });
  },

  async addEmergencyContact(data: Omit<EmergencyContact, 'contact_id'>): Promise<EmergencyContact> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const contact: EmergencyContact = { ...data, contact_id: generateId('ec') };
      store.emergency_contacts.push(contact);
      return contact;
    });
  },

  async updateEmergencyContact(id: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.emergency_contacts.findIndex((ec) => ec.contact_id === id);
      if (idx === -1) throw new Error('Emergency contact not found');
      store.emergency_contacts[idx] = { ...store.emergency_contacts[idx], ...updates };
      return store.emergency_contacts[idx];
    });
  },

  async deleteEmergencyContact(id: string): Promise<void> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.emergency_contacts.findIndex((ec) => ec.contact_id === id);
      if (idx === -1) throw new Error('Emergency contact not found');
      store.emergency_contacts.splice(idx, 1);
    });
  },
};
