import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FormField } from '../../components/ui/FormField';
import { patientService } from '../../services/patient.service';
import type { Patient } from '../../types';

const patientSchema = z.object({
  national_id: z.string().min(1, 'National ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female'], { required_error: 'Gender is required' }),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    required_error: 'Blood type is required',
  }),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['active', 'inactive', 'discharged']),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient | null;
  onSuccess: () => void;
}

export function PatientForm({ patient, onSuccess }: PatientFormProps) {
  const methods = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient
      ? {
          national_id: patient.national_id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          blood_type: patient.blood_type,
          phone: patient.phone,
          email: patient.email,
          address: patient.address,
          status: patient.status,
        }
      : {
          national_id: '',
          first_name: '',
          last_name: '',
          date_of_birth: '',
          gender: 'male' as const,
          blood_type: 'O+' as const,
          phone: '',
          email: '',
          address: '',
          status: 'active' as const,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: PatientFormData) => patientService.create(data),
    onSuccess: () => {
      toast.success('Patient created successfully');
      onSuccess();
    },
    onError: () => toast.error('Failed to create patient'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PatientFormData) => patientService.update(patient!.id, data),
    onSuccess: () => {
      toast.success('Patient updated successfully');
      onSuccess();
    },
    onError: () => toast.error('Failed to update patient'),
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
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField name="first_name" label="First Name" required placeholder="John" />
          <FormField name="last_name" label="Last Name" required placeholder="Doe" />
          <FormField name="national_id" label="National ID" required placeholder="NID-XXXXX" />
          <FormField name="date_of_birth" label="Date of Birth" type="date" required />
          <FormField
            name="gender"
            label="Gender"
            type="select"
            required
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
          />
          <FormField
            name="blood_type"
            label="Blood Type"
            type="select"
            required
            options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({
              value: v,
              label: v,
            }))}
          />
          <FormField name="phone" label="Phone" type="tel" required placeholder="+1-555-0000" />
          <FormField name="email" label="Email" type="email" placeholder="email@example.com" />
          <FormField
            name="status"
            label="Status"
            type="select"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'discharged', label: 'Discharged' },
            ]}
          />
        </div>
        <FormField name="address" label="Address" type="textarea" required placeholder="Full address..." />

        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="gradient-btn px-6 py-2.5 text-sm flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {patient ? 'Update Patient' : 'Create Patient'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
