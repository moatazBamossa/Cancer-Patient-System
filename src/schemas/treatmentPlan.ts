import { z } from 'zod';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export function createTreatmentPlanSchema(t: TFunction) {
  return z.object({
    diagnosis_id: z.coerce.number().min(1, t('treatment.validation.diagnosisRequired')),
    treating_doctor_id: z.coerce.number().min(1, t('treatment.validation.doctorRequired')),
    plan_type: z.string().min(1, t('treatment.validation.planTypeRequired')),
    protocol_name: z.string().min(1, t('treatment.validation.protocolNameRequired')),
    treatment_goal: z.string().min(1, t('treatment.validation.goalRequired')),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    start_date: z.string().min(1, t('treatment.validation.startDateRequired')),
    expected_end_date: z.string().optional(),
    total_cycles: z.coerce.number().min(1, t('treatment.validation.totalCyclesMin')),
    status: z.enum(['draft', 'active', 'completed', 'cancelled']),
    response_status: z
      .enum(['complete_response', 'partial_response', 'stable_disease', 'progressive_disease'])
      .optional()
      .or(z.literal('')),
    notes: z.string().optional(),
  });
}

export function createTreatmentCycleSchema(t: TFunction) {
  return z.object({
    plan_id: z.coerce.number().min(1, t('treatment.validation.planRequired')),
    cycle_number: z.coerce.number().min(1, t('treatment.validation.cycleNumberRequired')),
    cycle_date: z.string().min(1, t('treatment.validation.cycleDateRequired')),
    status: z.enum(['scheduled', 'completed', 'skipped', 'delayed']),
    side_effects: z.string().optional(),
    progress_notes: z.string().optional(),
    administered_by: z.union([z.coerce.number().min(1), z.literal('')]).optional(),
  });
}

export function createCycleMedicationSchema(t: TFunction) {
  return z.object({
    cycle_id: z.coerce.number().min(1, t('treatment.validation.cycleRequired')),
    medication_id: z.string().min(1, t('treatment.validation.medicationRequired')),
    dose: z.coerce.number().positive(t('treatment.validation.doseUnitRequired')),
    dose_unit: z.string().min(1, t('treatment.validation.doseUnitRequired')),
    route: z.string().min(1, t('treatment.validation.routeRequired')),
    frequency: z.string().min(1, t('treatment.validation.frequencyRequired')),
    note: z.string().optional(),
  });
}

export type TreatmentPlanFormValues = z.infer<ReturnType<typeof createTreatmentPlanSchema>>;
export type TreatmentCycleFormValues = z.infer<ReturnType<typeof createTreatmentCycleSchema>>;
export type CycleMedicationFormValues = z.infer<ReturnType<typeof createCycleMedicationSchema>>;
