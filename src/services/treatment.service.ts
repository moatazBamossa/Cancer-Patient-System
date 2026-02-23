import type {
  TreatmentPlan, TreatmentCycle, CycleMedication,
  VitalSigns, Medication, PaginationParams, PaginatedResponse,
} from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';

export const treatmentService = {
  // ─── Treatment Plans ────────────────────────
  async getPlans(params: PaginationParams): Promise<PaginatedResponse<TreatmentPlan>> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return paginateData(
        store.treatment_plans as unknown as Record<string, unknown>[],
        params,
        ['title', 'description', 'status'] as never[]
      ) as unknown as PaginatedResponse<TreatmentPlan>;
    });
  },

  async getPlansByPatient(patientId: string): Promise<TreatmentPlan[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.treatment_plans.filter((tp) => tp.patient_id === patientId);
    });
  },

  async createPlan(data: Omit<TreatmentPlan, 'id' | 'created_at'>): Promise<TreatmentPlan> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const plan: TreatmentPlan = { ...data, id: generateId('tp'), created_at: new Date().toISOString() };
      store.treatment_plans.push(plan);
      return plan;
    });
  },

  async updatePlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.treatment_plans.findIndex((tp) => tp.id === id);
      if (idx === -1) throw new Error('Treatment plan not found');
      store.treatment_plans[idx] = { ...store.treatment_plans[idx], ...updates };
      return store.treatment_plans[idx];
    });
  },

  // ─── Treatment Cycles ──────────────────────
  async getCyclesByPlan(planId: string): Promise<TreatmentCycle[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.treatment_cycles.filter((tc) => tc.treatment_plan_id === planId);
    });
  },

  async getCyclesByPatient(patientId: string): Promise<TreatmentCycle[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const planIds = store.treatment_plans
        .filter((tp) => tp.patient_id === patientId)
        .map((tp) => tp.id);
      return store.treatment_cycles.filter((tc) => planIds.includes(tc.treatment_plan_id));
    });
  },

  async createCycle(data: Omit<TreatmentCycle, 'id'>): Promise<TreatmentCycle> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const cycle: TreatmentCycle = { ...data, id: generateId('tc') };
      store.treatment_cycles.push(cycle);
      return cycle;
    });
  },

  async updateCycle(id: string, updates: Partial<TreatmentCycle>): Promise<TreatmentCycle> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.treatment_cycles.findIndex((tc) => tc.id === id);
      if (idx === -1) throw new Error('Treatment cycle not found');
      store.treatment_cycles[idx] = { ...store.treatment_cycles[idx], ...updates };
      return store.treatment_cycles[idx];
    });
  },

  // ─── Cycle Medications ──────────────────────
  async getCycleMedications(cycleId: string): Promise<CycleMedication[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.cycle_medications.filter((cm) => cm.cycle_id === cycleId);
    });
  },

  async addCycleMedication(data: Omit<CycleMedication, 'id'>): Promise<CycleMedication> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const cm: CycleMedication = { ...data, id: generateId('cm') };
      store.cycle_medications.push(cm);
      return cm;
    });
  },

  // ─── Vital Signs ───────────────────────────
  async getVitalsByPatient(patientId: string): Promise<VitalSigns[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.vital_signs
        .filter((v) => v.patient_id === patientId)
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    });
  },

  async addVitals(data: Omit<VitalSigns, 'id'>): Promise<VitalSigns> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const vitals: VitalSigns = { ...data, id: generateId('vs') };
      store.vital_signs.push(vitals);
      return vitals;
    });
  },

  // ─── Medications ───────────────────────────
  async getMedications(): Promise<Medication[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.medications;
    });
  },

  async addMedication(data: Omit<Medication, 'id' | 'created_at'>): Promise<Medication> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const med: Medication = { ...data, id: generateId('med'), created_at: new Date().toISOString() };
      store.medications.push(med);
      return med;
    });
  },

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.medications.findIndex((m) => m.id === id);
      if (idx === -1) throw new Error('Medication not found');
      store.medications[idx] = { ...store.medications[idx], ...updates };
      return store.medications[idx];
    });
  },

  async getPatientMedications(patientId: string): Promise<CycleMedication[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const planIds = store.treatment_plans.filter((tp) => tp.patient_id === patientId).map((tp) => tp.id);
      const cycleIds = store.treatment_cycles.filter((tc) => planIds.includes(tc.treatment_plan_id)).map((tc) => tc.id);
      return store.cycle_medications.filter((cm) => cycleIds.includes(cm.cycle_id));
    });
  },
};
