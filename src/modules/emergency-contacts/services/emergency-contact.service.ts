import { supabase } from '../../../lib/supabaseClient';
import type {
  EmergencyContactDto,
  EmergencyContact,
  CreateEmergencyContactParams,
  UpdateEmergencyContactParams,
} from '../types';
import { normalizeEmergencyContacts, normalizeEmergencyContact } from '../utils/emergency-contact-normalizer';

export const emergencyContactService = {
  async emergency_contact_create(params: CreateEmergencyContactParams): Promise<EmergencyContact> {
    const { data, error } = await supabase.rpc('emergency_contact_create', {
      p_patient_id: params.patient_id,
      p_full_name: params.full_name,
      p_relationship: params.relationship,
      p_phone: params.phone,
      p_alt_phone: params.alt_phone ?? null,
      p_notes: params.notes ?? null,
    });
    if (error) throw error;
    if (!data) throw new Error('emergency_contact_create: no data returned');
    return normalizeEmergencyContact(data as EmergencyContactDto);
  },

  async emergency_contact_list_by_patient(patientId: number): Promise<EmergencyContact[]> {
    const { data, error } = await supabase.rpc('emergency_contact_list_by_patient', { p_patient_id: patientId });
    if (error) throw error;
    return data.contacts;
  },

  async emergency_contact_update(params: UpdateEmergencyContactParams): Promise<EmergencyContact> {
    const { data, error } = await supabase.rpc('emergency_contact_update', {
      p_contact_id: params.contact_id,
      p_full_name: params.full_name,
      p_relationship: params.relationship,
      p_phone: params.phone,
      p_alt_phone: params.alt_phone ?? null,
      p_notes: params.notes ?? null,
    });
    if (error) throw error;
    if (!data) throw new Error('emergency_contact_update: no data returned');
    return normalizeEmergencyContact(data as EmergencyContactDto);
  },

  async emergency_contact_delete(contactId: number): Promise<void> {
    const { error } = await supabase.rpc('emergency_contact_delete', { p_contact_id: contactId });
    if (error) throw error;
  },
};
