export interface EmergencyContactDto {
  contact_id: number;
  patient_id: number;
  full_name: string;
  relationship: string;
  phone: string | null;
  alt_phone: string | null;
  notes: string | null;
}

export interface EmergencyContact {
  contact_id: number;
  patient_id: number;
  full_name: string;
  relationship: string;
  phone: string | null;
  alt_phone: string | null;
  notes: string | null;
}

export interface EmergencyContactResponse {
  success: boolean;
  message: string;
  contact: EmergencyContactDto;
}

export interface EmergencyContactListResponse {
  success: boolean;
  message: string;
  contacts: EmergencyContactDto[];
}

export interface CreateEmergencyContactParams {
  patient_id: number;
  full_name: string;
  relationship: string;
  phone: string;
  alt_phone?: string | null;
  notes?: string | null;
}

export interface UpdateEmergencyContactParams {
  contact_id: number;
  full_name: string;
  relationship: string;
  phone: string;
  alt_phone?: string | null;
  notes?: string | null;
}

export interface DeleteEmergencyContactParams {
  contact_id: number;
}
