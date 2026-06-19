import { z } from 'zod';

export const clinicVisitSchema = z.object({
  p_visit_date: z.string().min(1, 'Visit date and time is required'),
  p_visit_type: z.string().min(1, 'Visit type is required'),
  p_reason_for_visit: z.string().min(1, 'Reason for visit is required'),
  p_clinical_notes: z.string().optional().default(''),
  p_recommendations: z.string().optional().default(''),
  p_next_visit_date: z.string().optional(),
  p_doctor_id: z.coerce.number({ invalid_type_error: 'Doctor is required' }).positive('Doctor is required'),
  p_diagnosis_id: z.coerce.number({ invalid_type_error: 'Diagnosis is required' }).positive('Diagnosis is required'),
});

export type ClinicVisitFormValues = z.infer<typeof clinicVisitSchema>;
