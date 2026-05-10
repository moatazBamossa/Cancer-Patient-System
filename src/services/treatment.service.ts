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
        ['protocol_name', 'notes', 'status'] as never[]
      ) as unknown as PaginatedResponse<TreatmentPlan>;
    });
  },

  async getPlansByDiagnosis(diagnosisId: string): Promise<TreatmentPlan[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.treatment_plans.filter((tp) => tp.diagnosis_id === diagnosisId);
    });
  },

  async getPlansByPatient(patientId: string): Promise<TreatmentPlan[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      // Get all diagnoses for the patient, then find their plans
      const diagnosisIds = store.diagnoses
        .filter((d) => d.patient_id === patientId)
        .map((d) => d.diagnosis_id);
      return store.treatment_plans.filter((tp) => diagnosisIds.includes(tp.diagnosis_id));
    });
  },

  async createPlan(data: Omit<TreatmentPlan, 'plan_id' | 'created_at' | 'updated_at'>): Promise<TreatmentPlan> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const plan: TreatmentPlan = { ...data, plan_id: generateId('tp'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      store.treatment_plans.push(plan);
      return plan;
    });
  },

  async updatePlan(id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.treatment_plans.findIndex((tp) => tp.plan_id === id);
      if (idx === -1) throw new Error('Treatment plan not found');
      store.treatment_plans[idx] = { ...store.treatment_plans[idx], ...updates, updated_at: new Date().toISOString() };
      return store.treatment_plans[idx];
    });
  },

  // ─── Treatment Cycles ──────────────────────
  async getCyclesByPlan(planId: string): Promise<TreatmentCycle[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.treatment_cycles.filter((tc) => tc.plan_id === planId);
    });
  },

  async getCyclesByPatient(patientId: string): Promise<TreatmentCycle[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const diagnosisIds = store.diagnoses
        .filter((d) => d.patient_id === patientId)
        .map((d) => d.diagnosis_id);
      const planIds = store.treatment_plans
        .filter((tp) => diagnosisIds.includes(tp.diagnosis_id))
        .map((tp) => tp.plan_id);
      return store.treatment_cycles.filter((tc) => planIds.includes(tc.plan_id));
    });
  },

  async createCycle(data: Omit<TreatmentCycle, 'cycle_id' | 'created_at'>): Promise<TreatmentCycle> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const cycle: TreatmentCycle = { ...data, cycle_id: generateId('tc'), created_at: new Date().toISOString() };
      store.treatment_cycles.push(cycle);
      return cycle;
    });
  },

  async updateCycle(id: string, updates: Partial<TreatmentCycle>): Promise<TreatmentCycle> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.treatment_cycles.findIndex((tc) => tc.cycle_id === id);
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
      // Get vitals linked to this patient's cycles or visits
      const diagnosisIds = store.diagnoses
        .filter((d) => d.patient_id === patientId)
        .map((d) => d.diagnosis_id);
      const planIds = store.treatment_plans
        .filter((tp) => diagnosisIds.includes(tp.diagnosis_id))
        .map((tp) => tp.plan_id);
      const cycleIds = store.treatment_cycles
        .filter((tc) => planIds.includes(tc.plan_id))
        .map((tc) => tc.cycle_id);
      const visitIds = store.clinic_visits
        .filter((v) => v.patient_id === patientId)
        .map((v) => v.visit_id);
      return store.vital_signs
        .filter((v) => (v.cycle_id && cycleIds.includes(v.cycle_id)) || (v.visit_id && visitIds.includes(v.visit_id)))
        .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
    });
  },

  async addVitals(data: Omit<VitalSigns, 'vital_id' | 'bmi'>): Promise<VitalSigns> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const bmi = data.height_cm > 0 ? +(data.weight_kg / ((data.height_cm / 100) ** 2)).toFixed(1) : 0;
      const vitals: VitalSigns = { ...data, vital_id: generateId('vs'), bmi };
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

  async addMedication(data: Omit<Medication, 'medication_id'>): Promise<Medication> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const med: Medication = { ...data, medication_id: generateId('med') };
      store.medications.push(med);
      return med;
    });
  },

  async updateMedication(id: string, updates: Partial<Medication>): Promise<Medication> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const idx = store.medications.findIndex((m) => m.medication_id === id);
      if (idx === -1) throw new Error('Medication not found');
      store.medications[idx] = { ...store.medications[idx], ...updates };
      return store.medications[idx];
    });
  },

  async getPatientMedications(patientId: string): Promise<CycleMedication[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const diagnosisIds = store.diagnoses.filter((d) => d.patient_id === patientId).map((d) => d.diagnosis_id);
      const planIds = store.treatment_plans.filter((tp) => diagnosisIds.includes(tp.diagnosis_id)).map((tp) => tp.plan_id);
      const cycleIds = store.treatment_cycles.filter((tc) => planIds.includes(tc.plan_id)).map((tc) => tc.cycle_id);
      return store.cycle_medications.filter((cm) => cycleIds.includes(cm.cycle_id));
    });
  },
};
