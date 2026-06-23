import { rpcCall } from '../utils/rpcCall';
import type {
	ClinicVisitRpcItem,
	VitalSignRpcItem,
	ClinicVisitListPayload,
	ClinicVisitMutationPayload,
	VitalSignListPayload,
	VitalSignMutationPayload,
	ClinicVisitCreateInput,
	ClinicVisitUpdateInput,
	VitalSignCreateInput,
	VitalSignUpdateInput,
	ClinicVisitWithVitalsCreateInput,
} from '../types/visitRpc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unwrapRpcEnvelope<T>(data: any, rpcKey?: string): T | null {
	if (!data) return null;

	if (Array.isArray(data)) {
		if (data.length === 0) return null;
		const first = data[0];
		if (first && typeof first === 'object') {
			if (rpcKey && first[rpcKey] !== undefined) {
				return first[rpcKey] as T;
			}
			const isSingleKeyObject = Object.keys(first).length === 1;
			const wrapperValue = Object.values(first)[0];
			if (isSingleKeyObject && wrapperValue !== undefined) {
				return wrapperValue as T;
			}
		}
		return data as unknown as T;
	}

	if (typeof data === 'object') {
		if (rpcKey && data[rpcKey] !== undefined) {
			return data[rpcKey] as T;
		}
		return data as T;
	}

	return null;
}

function extractVisits(data: any, rpcKey?: string): ClinicVisitRpcItem[] {
	if (!data) return [];
	const payload = unwrapRpcEnvelope<any>(data, rpcKey);
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;
	if (payload.visits) return payload.visits;
	return [];
}

function extractVisit(data: any, rpcKey?: string): ClinicVisitRpcItem | null {
	if (!data) return null;
	const payload = unwrapRpcEnvelope<any>(data, rpcKey);
	if (!payload) return null;
	if (payload.visit) return payload.visit;
	if (Array.isArray(payload) && payload.length > 0) return payload[0];
	return null;
}

function extractVitals(data: any, rpcKey?: string): VitalSignRpcItem[] {
	if (!data) return [];
	const payload = unwrapRpcEnvelope<any>(data, rpcKey);
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;
	if (payload.vitals) return payload.vitals;
	return [];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const visitService = {
	// ─── Clinic Visits ───

	async createVisit(
		input: ClinicVisitCreateInput,
	): Promise<ClinicVisitRpcItem> {
		const data = await rpcCall<ClinicVisitMutationPayload>(
			'clinic_visit_create',
			{
				p_patient_id: input.p_patient_id,
				p_doctor_id: input.p_doctor_id,
				p_diagnosis_id: input.p_diagnosis_id ?? null,
				p_visit_date: input.p_visit_date,
				p_visit_type: input.p_visit_type ?? null,
				p_reason_for_visit: input.p_reason_for_visit,
				p_clinical_notes: input.p_clinical_notes ?? null,
				p_recommendations: input.p_recommendations ?? null,
				p_next_visit_date: input.p_next_visit_date ?? null,
			},
		);
		const visit = extractVisit(data, 'clinic_visit_create');
		if (visit) return visit;
		return data as unknown as ClinicVisitRpcItem;
	},

	async listUpcomingDualDate(filters: any): Promise<any[]> {
 		const data = await rpcCall<any>('clinic_visits_upcoming_dual_date', {
 			p_from_visit_date: filters?.p_from_visit_date ?? null,
 			p_to_visit_date: filters?.p_to_visit_date ?? null,
 			p_from_next_date: filters?.p_from_next_date ?? null,
 			p_to_next_date: filters?.p_to_next_date ?? null,
 			p_doctor_id: filters?.p_doctor_id ?? null,
 			p_diagnosis_id: filters?.p_diagnosis_id ?? null,
 			p_patient_id: filters?.p_patient_id ?? null,
 		});

 		const items = data?.visits ?? [];

 		// Normalize to the shape the UI expects (compat with existing mock structure)
		return items.map((it: any) => ({
 			visit_id: it.visit_id,
 			visit_date: it.visit_date,
 			visit_type: it.visit_type,
 			reason_for_visit: it.reason_for_visit,
 			patients: {
 				patient_id: it.patient_id,
 				full_name: it.patient_name || it.patient_full_name || '',
 				phone: it.patient_phone ?? null,
 				mobile_number: it.patient_mobile ?? null,
 				national_id: it.patient_national_id ?? null,
 			},
 			doctors: {
 				doctor_id: it.doctor_id,
 				full_name: it.doctor_name || it.doctor_full_name || '',
 			},
 			...it,
 		}));
	},

	async getVisitById(id: number): Promise<ClinicVisitRpcItem | null> {
		const data = await rpcCall<ClinicVisitMutationPayload>(
			'clinic_visit_get_by_id',
			{
				p_visit_id: id,
			},
		);
		const visit = extractVisit(data, 'clinic_visit_get_by_id');
		if (visit) return visit;
		if (Array.isArray(data) && data.length > 0) return (data as any[])[0];
		return null;
	},

	async listVisitsByPatient(patientId: number): Promise<ClinicVisitRpcItem[]> {
		const data = await rpcCall<ClinicVisitListPayload>(
			'clinic_visit_list_by_patient',
			{
				p_patient_id: patientId,
			},
		);
		return extractVisits(data, 'clinic_visit_list_by_patient');
	},

	async updateVisit(
		input: ClinicVisitUpdateInput,
	): Promise<ClinicVisitRpcItem> {
		const data = await rpcCall<ClinicVisitMutationPayload>(
			'clinic_visit_update',
			{
				p_visit_id: input.p_visit_id,
				p_patient_id: input.p_patient_id,
				p_doctor_id: input.p_doctor_id,
				p_diagnosis_id: input.p_diagnosis_id ?? null,
				p_visit_date: input.p_visit_date,
				p_visit_type: input.p_visit_type ?? null,
				p_reason_for_visit: input.p_reason_for_visit,
				p_clinical_notes: input.p_clinical_notes ?? null,
				p_recommendations: input.p_recommendations ?? null,
				p_next_visit_date: input.p_next_visit_date ?? null,
			},
		);
		const visit = extractVisit(data, 'clinic_visit_update');
		if (visit) return visit;
		return data as unknown as ClinicVisitRpcItem;
	},

	async listAllVisits(): Promise<ClinicVisitRpcItem[]> {
		const data = await rpcCall<ClinicVisitListPayload>(
			'clinic_visit_list_all',
			{},
		);
		return extractVisits(data, 'clinic_visit_list_all');
	},

	async deleteVisit(id: number): Promise<void> {
		await rpcCall<any>('clinic_visit_delete', { p_visit_id: id });
	},

	// ─── Vital Signs ───

	async createVitalSign(
		input: VitalSignCreateInput,
	): Promise<VitalSignRpcItem> {
		const data = await rpcCall<VitalSignMutationPayload>('vital_sign_create', {
			p_visit_id: input.p_visit_id,
			p_temperature: input.p_temperature ?? null,
			p_blood_pressure_sys: input.p_blood_pressure_sys ?? null,
			p_blood_pressure_dia: input.p_blood_pressure_dia ?? null,
			p_heart_rate: input.p_heart_rate ?? null,
			p_respiratory_rate: input.p_respiratory_rate ?? null,
			p_spo2: input.p_spo2 ?? null,
			p_weight_kg: input.p_weight_kg ?? null,
			p_height_cm: input.p_height_cm ?? null,
			p_notes: input.p_notes ?? null,
		});
		if (data?.vital) return data.vital;
		return data as unknown as VitalSignRpcItem;
	},

	async listVitalsByVisit(visitId: number): Promise<VitalSignRpcItem[]> {
		const data = await rpcCall<VitalSignListPayload>(
			'vital_sign_list_by_visit',
			{
				p_visit_id: visitId,
			},
		);
		return extractVitals(data);
	},

	async updateVitalSign(
		input: VitalSignUpdateInput,
	): Promise<VitalSignRpcItem> {
		const data = await rpcCall<VitalSignMutationPayload>('vital_sign_update', {
			p_vital_id: input.p_vital_id,
			p_visit_id: input.p_visit_id,
			p_temperature: input.p_temperature ?? null,
			p_blood_pressure_sys: input.p_blood_pressure_sys ?? null,
			p_blood_pressure_dia: input.p_blood_pressure_dia ?? null,
			p_heart_rate: input.p_heart_rate ?? null,
			p_respiratory_rate: input.p_respiratory_rate ?? null,
			p_spo2: input.p_spo2 ?? null,
			p_weight_kg: input.p_weight_kg ?? null,
			p_height_cm: input.p_height_cm ?? null,
			p_notes: input.p_notes ?? null,
		});
		if (data?.vital) return data.vital;
		return data as unknown as VitalSignRpcItem;
	},

	async deleteVitalSign(id: number): Promise<void> {
		await rpcCall<any>('vital_sign_delete', { p_vital_id: id });
	},

	// ─── Combined ───

	async createVisitWithVitals(
		input: ClinicVisitWithVitalsCreateInput,
	): Promise<any> {
		const data = await rpcCall<any>('clinic_visit_with_vitals_create', {
			p_patient_id: input.p_patient_id,
			p_doctor_id: input.p_doctor_id,
			p_diagnosis_id: input.p_diagnosis_id ?? null,
			p_visit_date: input.p_visit_date,
			p_visit_type: input.p_visit_type ?? null,
			p_reason_for_visit: input.p_reason_for_visit,
			p_clinical_notes: input.p_clinical_notes ?? null,
			p_recommendations: input.p_recommendations ?? null,
			p_next_visit_date: input.p_next_visit_date ?? null,
			p_temperature: input.p_temperature ?? null,
			p_blood_pressure_sys: input.p_blood_pressure_sys ?? null,
			p_blood_pressure_dia: input.p_blood_pressure_dia ?? null,
			p_heart_rate: input.p_heart_rate ?? null,
			p_respiratory_rate: input.p_respiratory_rate ?? null,
			p_spo2: input.p_spo2 ?? null,
			p_weight_kg: input.p_weight_kg ?? null,
			p_height_cm: input.p_height_cm ?? null,
			p_bmi: input.p_bmi ?? null,
			p_vital_notes: input.p_vital_notes ?? null,
		});
		return data;
	},
};
