import { z } from 'zod';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

export function createVitalSignSchema(t: TFunction) {
  return z.object({
    p_temperature: z.coerce.number({ invalid_type_error: t('vitals.validation.tempRequired') }).min(25, t('vitals.validation.tempRequired')).max(45, t('vitals.validation.tempInvalid')),
    p_blood_pressure_sys: z.coerce.number({ invalid_type_error: t('vitals.validation.sysRequired') }).min(30, t('vitals.validation.sysRequired')).max(300, t('vitals.validation.sysInvalid')),
    p_blood_pressure_dia: z.coerce.number({ invalid_type_error: t('vitals.validation.diaRequired') }).min(20, t('vitals.validation.diaRequired')).max(200, t('vitals.validation.diaInvalid')),
    p_heart_rate: z.coerce.number({ invalid_type_error: t('vitals.validation.heartRateRequired') }).min(20, t('vitals.validation.heartRateRequired')).max(220, t('vitals.validation.heartRateInvalid')),
    p_respiratory_rate: z.coerce.number({ invalid_type_error: t('vitals.validation.respRequired') }).min(5, t('vitals.validation.respRequired')).max(80, t('vitals.validation.respInvalid')),
    p_spo2: z.coerce.number({ invalid_type_error: t('vitals.validation.spo2Required') }).min(50, t('vitals.validation.spo2Required')).max(100, t('vitals.validation.spo2Invalid')),
    p_weight_kg: z.coerce.number({ invalid_type_error: t('vitals.validation.weightRequired') }).min(1, t('vitals.validation.weightRequired')).max(500, t('vitals.validation.weightInvalid')),
    p_height_cm: z.coerce.number({ invalid_type_error: t('vitals.validation.heightRequired') }).min(20, t('vitals.validation.heightRequired')).max(300, t('vitals.validation.heightInvalid')),
    p_bmi: z.coerce.number().optional().nullable(),
    p_notes: z.string().optional().default(''),
  });
}

export type VitalSignFormValues = z.infer<ReturnType<typeof createVitalSignSchema>>;
