import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Modal } from './ui/Modal';
import { clinicVisitSchema, type ClinicVisitFormValues } from '../schemas/clinicVisit';
import { useCreateVisit } from '../hooks/useClinicVisits';
import type { Diagnosis, Doctor } from '../types';
import { useTranslation } from 'react-i18next';

interface AddVisitFormProps {
  patientId: number;
  doctors: Doctor[];
  diagnoses: Diagnosis[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddVisitForm({ patientId, doctors, diagnoses, isOpen, onClose, onSuccess }: AddVisitFormProps) {
  const { t } = useTranslation();
  const createVisit = useCreateVisit(patientId);

  const { register, handleSubmit, formState, reset } = useForm<ClinicVisitFormValues>({
    resolver: zodResolver(clinicVisitSchema),
    defaultValues: {
      p_visit_date: '',
      p_visit_type: '',
      p_reason_for_visit: '',
      p_clinical_notes: '',
      p_recommendations: '',
      p_next_visit_date: '',
      p_doctor_id: 0,
      p_diagnosis_id: 0,
    },
  });

  const onSubmit = async (values: ClinicVisitFormValues) => {
    try {
      const payload = {
        p_patient_id: patientId,
        p_doctor_id: Number(values.p_doctor_id),
        p_diagnosis_id: Number(values.p_diagnosis_id),
        p_visit_date: new Date(values.p_visit_date).toISOString(),
        p_visit_type: values.p_visit_type,
        p_reason_for_visit: values.p_reason_for_visit,
        p_clinical_notes: values.p_clinical_notes || '',
        p_recommendations: values.p_recommendations || '',
        p_next_visit_date: values.p_next_visit_date || undefined,
      };

      await createVisit.mutateAsync(payload);
      toast.success(t('visits.clinicVisitAdded'));
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error((error as Error).message || t('visits.unableCreateClinicVisit'));
    }
  };

  const sortedDoctorOptions = useMemo(
    () => doctors.slice().sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [doctors],
  );

  const sortedDiagnosisOptions = useMemo(
    () => diagnoses.slice().sort((a, b) => {
      const aLabel = a.cancer_name ?? a.notes ?? String(a.diagnosis_id ?? '');
      const bLabel = b.cancer_name ?? b.notes ?? String(b.diagnosis_id ?? '');
      return String(aLabel).localeCompare(String(bLabel));
    }),
    [diagnoses],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('visits.addClinicVisit')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block text-sm text-slate-700">
            {t('visits.visitDateTime')}
            <input
              type="datetime-local"
              {...register('p_visit_date')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_visit_date && (
              <span className="text-xs text-red-500">{formState.errors.p_visit_date.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('visits.visitType')}
            <select {...register('p_visit_type')} className="input-field mt-2 w-full">
              <option value="">{t('visits.selectType')}</option>
              <option value="new_visit">{t('visits.newVisit')}</option>
              <option value="follow_up">{t('visits.visitTypeLabels.followUp')}</option>
              <option value="emergency">{t('visits.visitTypeLabels.emergency')}</option>
              <option value="treatment_session">{t('visits.treatmentSession')}</option>
              <option value="consultation">{t('visits.visitTypeLabels.consultation')}</option>
            </select>
            {formState.errors.p_visit_type && (
              <span className="text-xs text-red-500">{formState.errors.p_visit_type.message}</span>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block text-sm text-slate-700">
            {t('common.doctor')}
            <select {...register('p_doctor_id')} className="input-field mt-2 w-full">
              <option value="0">{t('visits.selectDoctor')}</option>
              {sortedDoctorOptions.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
            {formState.errors.p_doctor_id && (
              <span className="text-xs text-red-500">{formState.errors.p_doctor_id.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('diagnoses.diagnosis')}
            <select {...register('p_diagnosis_id')} className="input-field mt-2 w-full">
              <option value="0">{t('visits.selectDiagnosis')}</option>
              {sortedDiagnosisOptions.map((diagnosis) => (
                <option key={diagnosis.diagnosis_id} value={diagnosis.diagnosis_id}>
                  {diagnosis.cancer_name ?? diagnosis.notes ?? diagnosis.diagnosis_id}
                </option>
              ))}
            </select>
            {formState.errors.p_diagnosis_id && (
              <span className="text-xs text-red-500">{formState.errors.p_diagnosis_id.message}</span>
            )}
          </label>
        </div>

        <label className="block text-sm text-slate-700">
          {t('visits.reasonForVisit')}
          <textarea
            {...register('p_reason_for_visit')}
            rows={3}
            className="input-field mt-2 w-full resize-none"
            placeholder={t('visits.describeReason')}
          />
          {formState.errors.p_reason_for_visit && (
            <span className="text-xs text-red-500">{formState.errors.p_reason_for_visit.message}</span>
          )}
        </label>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <label className="block text-sm text-slate-700">
            {t('visits.consultationNotes')}
            <textarea
              {...register('p_clinical_notes')}
              rows={3}
              className="input-field mt-2 w-full resize-none"
              placeholder={t('visits.optionalClinicalNotes')}
            />
          </label>

          <label className="block text-sm text-slate-700">
            {t('visits.recommendations')}
            <textarea
              {...register('p_recommendations')}
              rows={3}
              className="input-field mt-2 w-full resize-none"
              placeholder={t('visits.optionalRecommendations')}
            />
          </label>
        </div>

        <label className="block text-sm text-slate-700">
          {t('visits.nextVisitDate')}
          <input
            type="date"
            {...register('p_next_visit_date')}
            className="input-field mt-2 w-full"
          />
        </label>

        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={createVisit.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {createVisit.isPending ? t('common.saving') : t('visits.saveVisit')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
