import type {
  Doctor,
  DoctorFormInput,
  DoctorListItem,
  DoctorMutationPayload,
  DoctorRpcPayload,
  Clinic,
  ClinicFormInput,
  ClinicListItem,
  ClinicMutationPayload,
  ClinicRpcPayload,
  ClinicVisit,
  PaginationParams,
  PaginatedResponse,
} from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';
import { rpcCall } from '../utils/rpcCall';

function unwrapRpcEnvelope<T>(response: unknown, rpcKey: string): T {
  if (Array.isArray(response) && response.length > 0) {
    const first = response[0] as Record<string, T>;
    if (first[rpcKey] !== undefined) {
      return first[rpcKey];
    }
  }

  if (response && typeof response === 'object' && rpcKey in response) {
    return (response as Record<string, T>)[rpcKey];
  }

  return response as T;
}

function normalizeDoctorListItem(item: DoctorListItem): DoctorWithClinic {
  return {
    doctor_id: String(item.doctor_id),
    full_name: item.full_name,
    specialty: item.specialty,
    clinic_id: String(item.clinic_id),
    clinic_name: item.clinic_name,
    license_number: item.license_number,
    phone: item.phone,
    email: item.email,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function extractDoctors(response: unknown, rpcKey: string): DoctorWithClinic[] {
  const payload = unwrapRpcEnvelope<DoctorRpcPayload>(response, rpcKey);

  if (!payload?.success) {
    throw new Error(payload?.message || 'Failed to fetch doctors');
  }

  return (payload.doctors ?? []).map(normalizeDoctorListItem);
}

function assertMutationSuccess(response: unknown, rpcKey: string): DoctorMutationPayload {
  const payload = unwrapRpcEnvelope<DoctorMutationPayload>(response, rpcKey);

  if (!payload?.success) {
    throw new Error(payload?.message || 'Operation failed');
  }

  return payload;
}

function normalizeClinicListItem(item: ClinicListItem): Clinic {
  return {
    clinic_id: String(item.clinic_id),
    clinic_name: item.clinic_name,
    address: item.address,
    phone: item.phone,
    created_at: item.created_at,
  };
}

function extractClinics(response: unknown, rpcKey: string): Clinic[] {
  const payload = unwrapRpcEnvelope<ClinicRpcPayload>(response, rpcKey);

  if (!payload?.success) {
    throw new Error(payload?.message || 'Failed to fetch clinics');
  }

  return (payload.clinics ?? []).map(normalizeClinicListItem);
}

function assertClinicMutationSuccess(response: unknown, rpcKey: string): ClinicMutationPayload {
  const payload = unwrapRpcEnvelope<ClinicMutationPayload>(response, rpcKey);

  if (!payload?.success) {
    throw new Error(payload?.message || 'Operation failed');
  }

  return payload;
}

export type DoctorWithClinic = Doctor & { clinic_name?: string };

export const doctorService = {
  // ─── Doctors (Supabase RPC) ───────────────────────────────
  async getAll(): Promise<DoctorWithClinic[]> {
    const response = await rpcCall<unknown>('doctor_list_all', {});
    return extractDoctors(response, 'doctor_list_all');
  },

  async searchByName(search: string): Promise<DoctorWithClinic[]> {
    const response = await rpcCall<unknown>('doctor_search_by_name', {
      p_search: search,
    });
    return extractDoctors(response, 'doctor_search_by_name');
  },

  async create(data: DoctorFormInput): Promise<DoctorWithClinic> {
    const response = await rpcCall<unknown>('doctor_create', {
      p_full_name: data.full_name,
      p_specialty: data.specialty,
      p_clinic_id: Number(data.clinic_id),
      p_license_number: data.license_number,
      p_phone: data.phone,
      p_email: data.email,
      p_is_active: data.is_active,
    });

    const payload = assertMutationSuccess(response, 'doctor_create');
    if (payload.doctor) {
      return normalizeDoctorListItem(payload.doctor);
    }

    return {
      doctor_id: '',
      full_name: data.full_name,
      specialty: data.specialty,
      clinic_id: data.clinic_id,
      license_number: data.license_number,
      phone: data.phone,
      email: data.email,
      is_active: data.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async update(doctorId: string, data: DoctorFormInput): Promise<DoctorWithClinic> {
    const response = await rpcCall<unknown>('doctor_update', {
      p_doctor_id: Number(doctorId),
      p_full_name: data.full_name,
      p_specialty: data.specialty,
      p_clinic_id: Number(data.clinic_id),
      p_license_number: data.license_number,
      p_phone: data.phone,
      p_email: data.email,
      p_is_active: data.is_active,
    });

    const payload = assertMutationSuccess(response, 'doctor_update');
    if (payload.doctor) {
      return normalizeDoctorListItem(payload.doctor);
    }

    return {
      doctor_id: doctorId,
      full_name: data.full_name,
      specialty: data.specialty,
      clinic_id: data.clinic_id,
      license_number: data.license_number,
      phone: data.phone,
      email: data.email,
      is_active: data.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async delete(doctorId: string): Promise<void> {
    const response = await rpcCall<unknown>('doctor_delete', {
      p_doctor_id: Number(doctorId),
    });
    assertMutationSuccess(response, 'doctor_delete');
  },

  async getById(id: string): Promise<Doctor> {
    const doctors = await this.getAll();
    const doc = doctors.find((d) => d.doctor_id === id);
    if (!doc) throw new Error('Doctor not found');
    return doc;
  },

  async getDoctorDiagnoses(doctorId: string) {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.diagnoses.filter((d) => d.supervising_doctor_id === doctorId);
    });
  },

  // ─── Clinics (Supabase RPC) ───────────────────────────────
  async getClinics(): Promise<Clinic[]> {
    const response = await rpcCall<unknown>('clinic_list_all', {});
    return extractClinics(response, 'clinic_list_all');
  },

  async searchClinicsByName(search: string): Promise<Clinic[]> {
    const response = await rpcCall<unknown>('clinic_search_by_name', {
      p_search: search,
    });
    return extractClinics(response, 'clinic_search_by_name');
  },

  async createClinic(data: ClinicFormInput): Promise<Clinic> {
    const response = await rpcCall<unknown>('clinic_create', {
      p_clinic_name: data.clinic_name,
      p_address: data.address,
      p_phone: data.phone,
    });

    const payload = assertClinicMutationSuccess(response, 'clinic_create');
    if (payload.clinic) {
      return normalizeClinicListItem(payload.clinic);
    }

    return {
      clinic_id: '',
      clinic_name: data.clinic_name,
      address: data.address,
      phone: data.phone,
      created_at: new Date().toISOString(),
    };
  },

  async updateClinic(clinicId: string, data: ClinicFormInput): Promise<Clinic> {
    const response = await rpcCall<unknown>('clinic_update', {
      p_clinic_id: Number(clinicId),
      p_clinic_name: data.clinic_name,
      p_address: data.address,
      p_phone: data.phone,
    });

    const payload = assertClinicMutationSuccess(response, 'clinic_update');
    if (payload.clinic) {
      return normalizeClinicListItem(payload.clinic);
    }

    return {
      clinic_id: clinicId,
      clinic_name: data.clinic_name,
      address: data.address,
      phone: data.phone,
      created_at: new Date().toISOString(),
    };
  },

  async deleteClinic(clinicId: string): Promise<void> {
    const response = await rpcCall<unknown>('clinic_delete', {
      p_clinic_id: Number(clinicId),
    });
    assertClinicMutationSuccess(response, 'clinic_delete');
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
        ['reason_for_visit', 'clinical_notes', 'visit_type'] as never[]
      ) as unknown as PaginatedResponse<ClinicVisit>;
    });
  },

  async getVisitsByPatient(patientId: string): Promise<ClinicVisit[]> {
    return simulateApiCall(() => {
      const store = getDataStore();
      return store.clinic_visits.filter((v) => v.patient_id === patientId);
    });
  },

  async createVisit(data: Omit<ClinicVisit, 'visit_id' | 'created_at'>): Promise<ClinicVisit> {
    return simulateApiCall(() => {
      const store = getDataStore();
      const visit: ClinicVisit = { ...data, visit_id: generateId('cv'), created_at: new Date().toISOString() };
      store.clinic_visits.push(visit);
      return visit;
    });
  },
};
