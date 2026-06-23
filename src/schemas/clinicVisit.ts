import { z } from 'zod';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export function createClinicVisitSchema(t: TFunction) {
  return z.object({
    p_visit_date: z.string().min(1, t('visits.validation.visitDateTimeRequired')),
    p_visit_type: z.string().min(1, t('visits.validation.visitTypeRequired')),
    p_reason_for_visit: z.string().min(1, t('visits.validation.reasonRequired')),
    p_clinical_notes: z.string().optional().default(''),
    p_recommendations: z.string().optional().default(''),
    p_next_visit_date: z.string().optional(),
    p_doctor_id: z.coerce.number({ invalid_type_error: t('visits.validation.doctorRequired') }).positive(t('visits.validation.doctorRequired')),
    p_diagnosis_id: z.coerce.number({ invalid_type_error: t('visits.validation.diagnosisRequired') }).positive(t('visits.validation.diagnosisRequired')),
  });
}

export type ClinicVisitFormValues = z.infer<ReturnType<typeof createClinicVisitSchema>>;
