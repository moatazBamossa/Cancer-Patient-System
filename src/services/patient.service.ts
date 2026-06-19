import type {
	Patient,
	PaginationParams,
	PaginatedResponse,
	EmergencyContact,
	PatientDetailsRpcResponse,
} from '../types';
import { getDataStore, simulateApiCall, paginateData } from './mockApi';
import { generateId } from '../lib/utils';
import { rpcCall } from '../utils/rpcCall';

export const patientService = {
	async getAll(
		params: PaginationParams & { status?: string },
	): Promise<PaginatedResponse<Patient>> {
		const response = await rpcCall<any>('patient_list');

		// The response is usually an array containing an object with a patient_list key
		// Handle both cases where it might return an array or the direct object
		let patientData = response;
		if (
			Array.isArray(response) &&
			response.length > 0 &&
			response[0].patient_list
		) {
			patientData = response[0].patient_list;
		} else if (response?.patient_list) {
			patientData = response.patient_list;
		}

		if (!patientData || !patientData.success) {
			throw new Error(patientData?.message || 'Failed to fetch patients');
		}

		let patients: Patient[] = patientData.patients || [];

		if (params.status) {
			patients = patients.filter((p) => p.status === params.status);
		}

		// Simple client-side search (fallback if not handled in RPC)
		if (params.search) {
			const searchLower = params.search.toLowerCase();
			patients = patients.filter(
				(p) =>
					p.full_name?.toLowerCase().includes(searchLower) ||
					p.national_id?.toLowerCase().includes(searchLower) ||
					p.phone?.toLowerCase().includes(searchLower) ||
					p.email?.toLowerCase().includes(searchLower),
			);
		}

		// Since RPC doesn't currently support pagination directly according to the user's sample
		// we'll apply client-side pagination to match the expected return type
		const total = patients.length;
		const startIndex = (params.page - 1) * params.pageSize;
		const endIndex = startIndex + params.pageSize;
		const paginatedPatients = patients.slice(startIndex, endIndex);

		return {
			data: paginatedPatients,
			total,
			page: params.page,
			pageSize: params.pageSize,
			totalPages: Math.ceil(total / params.pageSize),
		};
	},

	async getById(id: string): Promise<Patient> {
		return simulateApiCall(() => {
			const store = getDataStore();
			const patient = store.patients.find((p) => p.patient_id === id);
			if (!patient) throw new Error('Patient not found');
			return patient;
		});
	},

	async getPatientDetails(
		patientId: number,
	): Promise<NonNullable<
		PatientDetailsRpcResponse['get_patient_details']
	> | null> {
		const response = await rpcCall<any>('get_patient_details', {
			p_patient_id: patientId,
		});

		// Handle array wrapping
		let data = response;
		if (Array.isArray(response) && response.length > 0) {
			data = response[0];
		}

		if (!data) return null;

		// Supabase RPC can return the object wrapped in a key with the function name
		if (data.get_patient_details) {
			return data.get_patient_details;
		}

		// Or it might just return the object directly
		return data;
	},

	async create(
		data: Omit<Patient, 'patient_id' | 'created_at' | 'updated_at'>,
	): Promise<Patient> {
		const response = await rpcCall<Patient>('patient_create', {
			p_national_id: data.national_id,
			p_full_name: data.full_name,
			p_birth_date: data.birth_date,
			p_gender: data.gender,
			p_phone: data.phone,
			p_mobile_number: data.mobile_number || null,
			p_address: data.address,
			p_blood_type: data.blood_type,
			p_email: data.email || null,
			p_status: data.status,
			p_nationality: data.nationality,
			p_notes: data.notes || null,
		});

		return response;
	},

	async update(id: string, updates: Partial<Patient>): Promise<Patient> {
		const response = await rpcCall<Patient>('patient_update', {
			p_patient_id: id,
			p_full_name: updates.full_name,
			p_national_id: updates.national_id,
			p_birth_date: updates.birth_date,
			p_gender: updates.gender,
			p_phone: updates.phone,
			p_mobile_number: updates.mobile_number || null,
			p_address: updates.address,
			p_blood_type: updates.blood_type,
			p_email: updates.email || null,
			p_status: updates.status,
			p_nationality: updates.nationality,
			p_notes: updates.notes || null,
		});

		return response;
	},

	async softDelete(id: string): Promise<void> {
		await rpcCall<any>('patient_set_status', {
			p_patient_id: id,
			p_status: 'deceased', // Soft delete sets status to deceased per existing logic
		});
	},

	async getEmergencyContacts(patientId: string): Promise<EmergencyContact[]> {
		return simulateApiCall(() => {
			const store = getDataStore();
			return store.emergency_contacts.filter(
				(ec) => ec.patient_id === patientId,
			);
		});
	},

	async addEmergencyContact(
		data: Omit<EmergencyContact, 'contact_id'>,
	): Promise<EmergencyContact> {
		return simulateApiCall(() => {
			const store = getDataStore();
			const contact: EmergencyContact = {
				...data,
				contact_id: generateId('ec'),
			};
			store.emergency_contacts.push(contact);
			return contact;
		});
	},

	async updateEmergencyContact(
		id: string,
		updates: Partial<EmergencyContact>,
	): Promise<EmergencyContact> {
		return simulateApiCall(() => {
			const store = getDataStore();
			const idx = store.emergency_contacts.findIndex(
				(ec) => ec.contact_id === id,
			);
			if (idx === -1) throw new Error('Emergency contact not found');
			store.emergency_contacts[idx] = {
				...store.emergency_contacts[idx],
				...updates,
			};
			return store.emergency_contacts[idx];
		});
	},

	async deleteEmergencyContact(id: string): Promise<void> {
		return simulateApiCall(() => {
			const store = getDataStore();
			const idx = store.emergency_contacts.findIndex(
				(ec) => ec.contact_id === id,
			);
			if (idx === -1) throw new Error('Emergency contact not found');
			store.emergency_contacts.splice(idx, 1);
		});
	},
};
