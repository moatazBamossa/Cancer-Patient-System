import { z } from 'zod';

export const vitalSignSchema = z.object({
  p_temperature: z.coerce.number({ invalid_type_error: 'Temperature is required' }).min(25, 'Temperature is required').max(45, 'Temperature is invalid'),
  p_blood_pressure_sys: z.coerce.number({ invalid_type_error: 'Systolic pressure is required' }).min(30, 'Systolic pressure is required').max(300, 'Systolic pressure is invalid'),
  p_blood_pressure_dia: z.coerce.number({ invalid_type_error: 'Diastolic pressure is required' }).min(20, 'Diastolic pressure is required').max(200, 'Diastolic pressure is invalid'),
  p_heart_rate: z.coerce.number({ invalid_type_error: 'Heart rate is required' }).min(20, 'Heart rate is required').max(220, 'Heart rate is invalid'),
  p_respiratory_rate: z.coerce.number({ invalid_type_error: 'Respiratory rate is required' }).min(5, 'Respiratory rate is required').max(80, 'Respiratory rate is invalid'),
  p_spo2: z.coerce.number({ invalid_type_error: 'SpO2 is required' }).min(50, 'SpO2 is required').max(100, 'SpO2 is invalid'),
  p_weight_kg: z.coerce.number({ invalid_type_error: 'Weight is required' }).min(1, 'Weight is required').max(500, 'Weight is invalid'),
  p_height_cm: z.coerce.number({ invalid_type_error: 'Height is required' }).min(20, 'Height is required').max(300, 'Height is invalid'),
  p_bmi: z.coerce.number().optional().nullable(),
  p_notes: z.string().optional().default(''),
});

export type VitalSignFormValues = z.infer<typeof vitalSignSchema>;
