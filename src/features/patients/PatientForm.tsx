import React from 'react';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import { zodValidator } from '../../lib/zodValidator';
import { patientService } from '../../services/patient.service';
import type { Patient } from '../../types';

interface PatientFormProps {
  patient?: Patient | null;
  onSuccess: () => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const { t } = useTranslation();

  const patientSchema = z.object({
    national_id: z.string().min(1, t('patients.nationalIdRequired')),
    full_name: z.string().min(1, t('patients.fullNameRequired')),
    birth_date: z.string().min(1, t('patients.dobRequired')),
    gender: z.enum(['male', 'female'], { required_error: t('patients.genderRequired') }),
    blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
      required_error: t('patients.bloodTypeRequired'),
    }),
    phone: z.string().min(1, t('patients.phoneRequired')),
    mobile_number: z.string().optional().default(''),
    email: z.string().email(t('patients.invalidEmail')).or(z.literal('')),
    address: z.string().min(1, t('patients.addressRequired')),
    nationality: z.string().min(1, t('patients.nationalityRequired')),
    status: z.enum(['active', 'deceased', 'transferred']),
    notes: z.string().optional().default(''),
  });

  type PatientFormData = z.infer<typeof patientSchema>;

  const initialValues: PatientFormData = patient
    ? {
        national_id: patient.national_id,
        full_name: patient.full_name,
        birth_date: patient.birth_date,
        gender: patient.gender,
        blood_type: patient.blood_type,
        phone: patient.phone,
        mobile_number: patient.mobile_number || '',
        email: patient.email,
        address: patient.address,
        nationality: patient.nationality || '',
        status: patient.status,
        notes: patient.notes || '',
      }
    : {
        national_id: '',
        full_name: '',
        birth_date: '',
        gender: 'male',
        blood_type: 'O+',
        phone: '',
        mobile_number: '',
        email: '',
        address: '',
        nationality: '',
        status: 'active',
        notes: '',
      };

  const createMutation = useMutation({
    mutationFn: (data: PatientFormData) => patientService.create(data),
    onSuccess: () => {
      toast.success(t('patients.createSuccess'));
      onSuccess();
    },
    onError: () => toast.error(t('patients.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PatientFormData) => patientService.update(patient!.patient_id, data),
    onSuccess: () => {
      toast.success(t('patients.updateSuccess'));
      onSuccess();
    },
    onError: () => toast.error(t('patients.updateError')),
  });

  const onSubmit = (data: PatientFormData) => {
    if (patient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AppForm<PatientFormData>
      formKey={patient?.patient_id ?? 'new'}
      initialValues={initialValues}
      validate={zodValidator(patientSchema)}
      onSubmit={onSubmit}
      className="space-y-4"
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="full_name" label={t('patients.fullName')} required placeholder="محمد علي" />
          <FormField name="national_id" label={t('patients.nationalId')} required placeholder="NID-XXXXX" />
          <FormField name="birth_date" label={t('patients.dob')} type="date" required />
          <FormField name="nationality" label={t('patients.nationality')} type="text" required placeholder="يمني" />
          <FormField
            name="gender"
            label={t('patients.gender')}
            type="select"
            required
            options={[
              { value: 'male', label: t('patients.male') },
              { value: 'female', label: t('patients.female') },
            ]}
          />
          <FormField
            name="blood_type"
            label={t('patients.bloodType')}
            type="select"
            required
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({
              value: v,
              label: v,
            }))}
          />
          <FormField name="phone" label={t('patients.phone')} type="tel" required placeholder="+967-XXXXXXXXX" />
          <FormField name="mobile_number" label={t('patients.mobileNumber')} type="tel" placeholder="+967-XXXXXXXXX" />
          <FormField name="email" label={t('patients.email')} type="email" placeholder="email@example.com" />
          <FormField
            name="status"
            label={t('common.status.label')}
            type="select"
            options={[
              { value: 'active', label: t('patients.status.active') },
              { value: 'deceased', label: t('patients.status.deceased') },
              { value: 'transferred', label: t('patients.status.transferred') },
            ]}
          />
        </div>
        <FormField name="address" label={t('patients.address')} type="textarea" required placeholder="..." />
        <FormField name="notes" label={t('common.notes')} type="textarea" placeholder="..." />

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="gradient-btn px-6 py-2.5 text-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {isSubmitting && t('patients.saving')}
            {!isSubmitting && (patient ? t('patients.updatePatient') : t('patients.createPatient'))}
          </button>
        </div>
    </AppForm>
  );
}
