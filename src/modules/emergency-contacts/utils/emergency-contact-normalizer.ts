import type { EmergencyContactDto, EmergencyContact } from '../types';

export function normalizeEmergencyContact(item: EmergencyContactDto): EmergencyContact {
  return {
    contact_id: item.contact_id,
    patient_id: item.patient_id,
    full_name: item.full_name,
    relationship: item.relationship,
    phone: item.phone,
    alt_phone: item.alt_phone,
    notes: item.notes,
  };
}

export function normalizeEmergencyContacts(items: EmergencyContactDto[]): EmergencyContact[] {
  return items.map(normalizeEmergencyContact);
}
