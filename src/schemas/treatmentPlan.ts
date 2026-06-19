import { z } from 'zod';

export const treatmentPlanSchema = z.object({
  diagnosis_id: z.coerce.number().min(1, 'Diagnosis is required'),
  treating_doctor_id: z.coerce.number().min(1, 'Doctor is required'),
  plan_type: z.string().min(1, 'Plan type is required'),
  protocol_name: z.string().min(1, 'Protocol name is required'),
  treatment_goal: z.string().min(1, 'Treatment goal is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  start_date: z.string().min(1, 'Start date is required'),
  expected_end_date: z.string().optional(),
  total_cycles: z.coerce.number().min(1, 'Total cycles must be at least 1'),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  response_status: z
    .enum(['complete_response', 'partial_response', 'stable_disease', 'progressive_disease'])
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

export const treatmentCycleSchema = z.object({
  plan_id: z.coerce.number().min(1, 'Plan is required'),
  cycle_number: z.coerce.number().min(1, 'Cycle number is required'),
  cycle_date: z.string().min(1, 'Cycle date is required'),
  status: z.enum(['scheduled', 'completed', 'skipped', 'delayed']),
  side_effects: z.string().optional(),
  progress_notes: z.string().optional(),
  administered_by: z.union([z.coerce.number().min(1), z.literal('')]).optional(),
});

export const cycleMedicationSchema = z.object({
  cycle_id: z.coerce.number().min(1, 'Cycle is required'),
  medication_id: z.coerce.number().min(1, 'Medication is required'),
  dose: z.coerce.number().positive('Dose must be positive'),
  dose_unit: z.string().min(1, 'Dose unit is required'),
  route: z.string().min(1, 'Route is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  note: z.string().optional(),
});

export type TreatmentPlanFormValues = z.infer<typeof treatmentPlanSchema>;
export type TreatmentCycleFormValues = z.infer<typeof treatmentCycleSchema>;
export type CycleMedicationFormValues = z.infer<typeof cycleMedicationSchema>;
