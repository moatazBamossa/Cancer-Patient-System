export const emergencyContactQueryKeys = {
  all: ['emergency_contacts'] as const,

  list: (patientId: number) => [...emergencyContactQueryKeys.all, 'patient', patientId] as const,

  detail: (contactId: number) => [...emergencyContactQueryKeys.all, 'detail', contactId] as const,
};
