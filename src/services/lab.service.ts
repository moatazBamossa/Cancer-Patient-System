import { rpcCall } from '../utils/rpcCall';
import type { LabTest, LabTestResult } from '../types';

type LabTestDto = {
  lab_test_id: number;
  test_name: string;
  category: string;
  units: string;
  normal_range: string;
  description: string;
};

export type LabTestPatientDto = {
  lab_test_patient_id: number;
  patient_id: string;
  lab_test_id: number;
  cycle_id: number | null;
  visit_id: number | null;
  result_value: string;
  is_abnormal: boolean;
  test_date: string;
  ordered_by?: number;
  notes: string;
  patient_name: string;
  lab_test_name: string;
  normal_range: string;
  result_status: string;
  ordered_by_name: string;
};

type LabTestListPayload = {
  success: boolean;
  message: string;
  lab_tests: LabTestDto[];
};

type LabTestMutationPayload = {
  success: boolean;
  message: string;
  lab_test: LabTestDto;
};

type LabTestPatientListPayload = {
  success: boolean;
  message: string;
  lab_test_patients: LabTestPatientDto[];
};

 type RpcResponse = {
    success?: boolean;
    message?: string;
    lab_test: { lab_test_id: number };
  };

   type RpcResponseLabTestPatient = {
    success?: boolean;
    message?: string;
    lab_test_patient: { lab_test_patient_id: number };
  };

type LabTestPatientMutationPayload = {
  success: boolean;
  message: string;
  lab_test_patient: LabTestPatientDto;
};

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

function assertRpcSuccess<T extends { success?: boolean; message?: string }>(payload: T, rpcKey: string): T {
  if (!payload || payload.success !== true) {
    throw new Error(payload?.message || `RPC ${rpcKey} failed`);
  }

  return payload;
}

function normalizeLabTest(item: LabTestDto): LabTest {
  return {
    ...item,
    lab_test_id: String(item.lab_test_id),
  };
}

function normalizeLabTestResult(item: LabTestPatientDto): LabTestResult {
  return {
    lab_test_patient_id: String(item.lab_test_patient_id),
    patient_id: String(item.patient_id),
    lab_test_id: String(item.lab_test_id),
    cycle_id: item.cycle_id === null ? null : String(item.cycle_id),
    visit_id: item.visit_id === null ? null : String(item.visit_id),
    result_value: item.result_value,
    is_abnormal: item.is_abnormal,
    test_date: item.test_date,
    ordered_by: String(item.ordered_by),
    notes: item.notes,
  };
}

export const labService = {
  async list(): Promise<LabTest[]> {
    const response = await rpcCall<unknown>('lab_test_list_all');
    const payload = assertRpcSuccess<LabTestListPayload>(unwrapRpcEnvelope(response, 'lab_test_list_all'), 'lab_test_list_all');
    return payload.lab_tests.map(normalizeLabTest);
  },

  async create(data: Omit<LabTest, 'lab_test_id'>): Promise<LabTest> {
    const response = await rpcCall<unknown>('lab_test_create', {
      p_test_name: data.test_name,
      p_category: data.category,
      p_units: data.units,
      p_normal_range: data.normal_range,
      p_description: data.description,
    });

    const payload = assertRpcSuccess<LabTestMutationPayload>(unwrapRpcEnvelope(response, 'lab_test_create'), 'lab_test_create');
    return normalizeLabTest(payload.lab_test);
  },

  async update(id: string, data: Omit<LabTest, 'lab_test_id'>): Promise<LabTest> {
    const response = await rpcCall<unknown>('lab_test_update', {
      p_lab_test_id: Number(id),
      p_test_name: data.test_name,
      p_category: data.category,
      p_units: data.units,
      p_normal_range: data.normal_range,
      p_description: data.description,
    });

    const payload = assertRpcSuccess<LabTestMutationPayload>(unwrapRpcEnvelope(response, 'lab_test_update'), 'lab_test_update');
    return normalizeLabTest(payload.lab_test);
  },

  async delete(id: string): Promise<number> {
    const response = await rpcCall<unknown>('lab_test_delete', {
      p_lab_test_id: Number(id),
    });
 const payload = assertRpcSuccess<RpcResponse>(
    unwrapRpcEnvelope(response, 'lab_test_delete'),
    'lab_test_delete'
  );

  return payload.lab_test.lab_test_id;
  },

  async listPatients(): Promise<LabTestPatientDto[]> {
    const response = await rpcCall<LabTestPatientListPayload>('lab_test_patient_list_all');

    const dtoList = Array.isArray(response)
      ? (response as LabTestPatientDto[])
      : assertRpcSuccess<LabTestPatientListPayload>(
          unwrapRpcEnvelope(response, 'lab_test_patient_list_all'),
          'lab_test_patient_list_all',
        ).lab_test_patients;

    return response.lab_test_patients;
  },

  async createPatient(data: Omit<LabTestResult, 'lab_test_patient_id'>): Promise<LabTestResult> {
    const response = await rpcCall<unknown>('lab_test_patient_create', {
      p_patient_id: Number(data.patient_id),
      p_lab_test_id: Number(data.lab_test_id),
      p_cycle_id: data.cycle_id ? Number(data.cycle_id) : null,
      p_visit_id: data.visit_id ? Number(data.visit_id) : null,
      p_result_value: data.result_value,
      p_is_abnormal: data.is_abnormal,
      p_test_date: data.test_date,
      p_ordered_by: Number(data.ordered_by),
      p_notes: data.notes,
    });

    const payload = assertRpcSuccess<LabTestPatientMutationPayload>(unwrapRpcEnvelope(response, 'lab_test_patient_create'), 'lab_test_patient_create');
    return normalizeLabTestResult(payload.lab_test_patient);
  },

  async updatePatient(data: LabTestPatientDto): Promise<LabTestPatientDto> {
    const response = await rpcCall<unknown>('lab_test_patient_update', {
      p_lab_test_patient_id: Number(data.lab_test_patient_id),
      p_patient_id: Number(data.patient_id),
      p_lab_test_id: Number(data.lab_test_id),
      p_cycle_id: data.cycle_id ? Number(data.cycle_id) : null,
      p_visit_id: data.visit_id ? Number(data.visit_id) : null,
      p_result_value: data.result_value,
      p_is_abnormal: data.is_abnormal,
      p_test_date: data.test_date,
      p_ordered_by: Number(data.ordered_by),
      p_notes: data.notes,
    });

    const payload = assertRpcSuccess<LabTestPatientMutationPayload>(unwrapRpcEnvelope(response, 'lab_test_patient_update'), 'lab_test_patient_update');
    return payload.lab_test_patient;
  },

  async deletePatient(id: string): Promise<number> {
    const response = await rpcCall<unknown>('lab_test_patient_delete', {
      p_lab_test_patient_id: Number(id),
    });

    const payload = assertRpcSuccess<RpcResponseLabTestPatient>(
    unwrapRpcEnvelope(response, 'lab_test_patient_delete'),
    'lab_test_patient_delete'
  );

  return payload.lab_test_patient.lab_test_patient_id;
  },
};
