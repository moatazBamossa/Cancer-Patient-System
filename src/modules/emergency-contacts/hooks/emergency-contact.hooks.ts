import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyContactService } from '../services/emergency-contact.service';
import { emergencyContactQueryKeys } from '../queries/emergency-contact-query-keys';
import type { EmergencyContact } from '../types';
import type { CreateEmergencyContactParams, UpdateEmergencyContactParams } from '../types';

export const useEmergencyContactsByPatientQuery = (patientId?: number) => {
  return useQuery<EmergencyContact[], Error>({
    queryKey: emergencyContactQueryKeys.list(patientId ?? 0),
    queryFn: () => emergencyContactService.emergency_contact_list_by_patient(patientId!),
    enabled: !!patientId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

export function useCreateEmergencyContactMutation() {
  const qc = useQueryClient();
  return useMutation<EmergencyContact, Error, CreateEmergencyContactParams>({
    mutationFn: (p) => emergencyContactService.emergency_contact_create(p),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: emergencyContactQueryKeys.list(variables.patient_id) });
    },
    onError: () => {},
  });
}

export function useUpdateEmergencyContactMutation() {
  const qc = useQueryClient();
  return useMutation<EmergencyContact, Error, UpdateEmergencyContactParams>({
    mutationFn: (p) => emergencyContactService.emergency_contact_update(p),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: emergencyContactQueryKeys.list(_data.patient_id) });
      qc.invalidateQueries({ queryKey: emergencyContactQueryKeys.detail(variables.contact_id) });
    },
    onError: () => {},
  });
}

export function useDeleteEmergencyContactMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => emergencyContactService.emergency_contact_delete(id),
    onSuccess: (_data, id) => {
      // We don't have patient id here; invalidate the whole list key
      qc.invalidateQueries({ queryKey: emergencyContactQueryKeys.all });
    },
    onError: () => {},
  });
}
