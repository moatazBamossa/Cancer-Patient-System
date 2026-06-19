import { rpcCall } from '../utils/rpcCall';
import type {
  ImagingReport,
  ImagingReportCreateInput,
  ImagingReportListFilters,
  ImagingReportMutationPayload,
  ImagingReportRpcItem,
  ImagingReportUpdateInput,
  ImagingReportsListPayload,
} from '../types';

function unwrapRpcEnvelope<T>(response: unknown, rpcKey: string): T {
  if (Array.isArray(response) && response.length > 0) {
    const first = response[0] as Record<string, unknown>;
    if (first[rpcKey] !== undefined) {
      return first[rpcKey] as T;
    }
  }

  if (response && typeof response === 'object' && rpcKey in response) {
    return (response as Record<string, T>)[rpcKey];
  }

  return response as T;
}

function normalizeImagingReport(item: ImagingReportRpcItem): ImagingReport {
  return {
    image_id: String(item.image_id),
    patient_id: String(item.patient_id),
    diagnosis_id: item.diagnosis_id == null ? null : String(item.diagnosis_id),
    ordered_by: String(item.ordered_by),
    imaging_type: (item.imaging_type as ImagingReport['imaging_type']) || 'CT',
    body_part: item.body_part || '',
    report_text: item.report_text || '',
    findings: item.findings || '',
    impression: item.impression || '',
    imaging_date: item.imaging_date || '',
    created_at: item.created_at || '',
    patient_name: item.patient_name || undefined,
    radiologist_name: item.radiologist_name || undefined,
  };
}

function extractImagingReports(response: unknown, rpcKey: string): ImagingReport[] {
  const payload = unwrapRpcEnvelope<ImagingReportsListPayload>(response, rpcKey);
  if (!payload || !payload.success) {
    throw new Error(payload?.message || 'Failed to load imaging reports');
  }

  const reports = payload.imaging_reports || [];
  return reports.map(normalizeImagingReport);
}

function extractImagingReport(response: unknown, rpcKey: string): ImagingReport {
  const payload = unwrapRpcEnvelope<ImagingReportMutationPayload>(response, rpcKey);
  if (!payload || !payload.success) {
    throw new Error(payload?.message || 'Imaging report operation failed');
  }

  if (!payload.imaging_report) {
    throw new Error('Imaging report response missing payload');
  }

  return normalizeImagingReport(payload.imaging_report);
}

export const imagingService = {
  async getAll(filters: ImagingReportListFilters = {}): Promise<ImagingReport[]> {
    const response = await rpcCall('get_imaging_reports_with_details', {
      p_patient_id: filters.p_patient_id ?? undefined,
      p_diagnosis_id: filters.p_diagnosis_id ?? undefined,
      p_doctors_id: filters.p_doctors_id ?? undefined,
      p_imaging_type: filters.p_imaging_type ?? undefined,
      p_from_date: filters.p_from_date ?? undefined,
      p_to_date: filters.p_to_date ?? undefined,
      p_search: filters.p_search ?? undefined,
    });

    return response.imaging_reports
  },

  async create(data: ImagingReportCreateInput): Promise<ImagingReport> {
    const response = await rpcCall('create_imaging_report', {
      p_patient_id:Number(data.p_patient_id),
      p_diagnosis_id: Number(data.p_diagnosis_id) ?? null,
      p_doctors_id: Number(data.p_doctors_id),
      p_imaging_type: data.p_imaging_type,
      p_body_part: data.p_body_part,
      p_report_text: data.p_report_text ?? null,
      p_findings: data.p_findings,
      p_impression: data.p_impression,
      p_imaging_date: data.p_imaging_date,
    });

    return response;
  },

  async update(data: ImagingReportUpdateInput): Promise<ImagingReport> {
    const response = await rpcCall('update_imaging_report', {
      p_image_id: data.p_image_id,
      p_patient_id: data.p_patient_id,
      p_diagnosis_id: data.p_diagnosis_id ?? null,
      p_doctors_id: data.p_doctors_id,
      p_imaging_type: data.p_imaging_type,
      p_body_part: data.p_body_part,
      p_report_text: data.p_report_text ?? null,
      p_findings: data.p_findings,
      p_impression: data.p_impression,
      p_imaging_date: data.p_imaging_date,
    });

    return response;
  },

  async delete(imageId: string): Promise<void> {
    const response = await rpcCall<unknown>('delete_imaging_report', {
      p_image_id: imageId,
    });
    const payload = unwrapRpcEnvelope<{ success?: boolean; message?: string }>(response, 'delete_imaging_report');
    if (payload && payload.success === false) {
      throw new Error(payload.message || 'Failed to delete imaging report');
    }
  },
};
