import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Modal } from './ui/Modal';
import { vitalSignSchema, type VitalSignFormValues } from '../schemas/vitalSigns';
import { useCreateVital } from '../hooks/useClinicVisits';
import { useTranslation } from 'react-i18next';

interface AddVitalSignsFormProps {
  visitId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddVitalSignsForm({ visitId, isOpen, onClose, onSuccess }: AddVitalSignsFormProps) {
  const { t } = useTranslation();
  const createVital = useCreateVital(visitId ?? 0);

  const { register, handleSubmit, formState, reset, watch, setValue } = useForm<VitalSignFormValues>({
    resolver: zodResolver(vitalSignSchema),
    defaultValues: {
      p_temperature: 37,
      p_blood_pressure_sys: 120,
      p_blood_pressure_dia: 80,
      p_heart_rate: 80,
      p_respiratory_rate: 18,
      p_spo2: 98,
      p_weight_kg: 70,
      p_height_cm: 170,
      p_bmi: 24.2,
      p_notes: '',
    },
  });

  const weight = watch('p_weight_kg');
  const height = watch('p_height_cm');

  useEffect(() => {
    const weightValue = Number(weight);
    const heightValue = Number(height);

    if (weightValue > 0 && heightValue > 0) {
      const meters = heightValue / 100;
      const bmi = weightValue / (meters * meters);
      setValue('p_bmi', Number(bmi.toFixed(1)));
    }
  }, [weight, height, setValue]);

  const onSubmit = async (values: VitalSignFormValues) => {
    if (!visitId) {
      toast.error(t('vitals.selectVisitBeforeAdding'));
      return;
    }

    try {
      await createVital.mutateAsync({
        p_visit_id: visitId,
        p_temperature: values.p_temperature,
        p_blood_pressure_sys: values.p_blood_pressure_sys,
        p_blood_pressure_dia: values.p_blood_pressure_dia,
        p_heart_rate: values.p_heart_rate,
        p_respiratory_rate: values.p_respiratory_rate,
        p_spo2: values.p_spo2,
        p_weight_kg: values.p_weight_kg,
        p_height_cm: values.p_height_cm,
        p_notes: values.p_notes || '',
      });

      toast.success(t('vitals.savedSuccessfully'));
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast.error((error as Error).message || t('vitals.unableSaveVitalSigns'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('vitals.addVitalSigns')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-700">
            {t('vitals.temperatureCelsius')}
            <input
              type="number"
              step="0.1"
              {...register('p_temperature')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_temperature && (
              <span className="text-xs text-red-500">{formState.errors.p_temperature.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.bloodPressureSystolic')}
            <input
              type="number"
              {...register('p_blood_pressure_sys')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_blood_pressure_sys && (
              <span className="text-xs text-red-500">{formState.errors.p_blood_pressure_sys.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.bloodPressureDiastolic')}
            <input
              type="number"
              {...register('p_blood_pressure_dia')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_blood_pressure_dia && (
              <span className="text-xs text-red-500">{formState.errors.p_blood_pressure_dia.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.heartRateBpm')}
            <input
              type="number"
              {...register('p_heart_rate')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_heart_rate && (
              <span className="text-xs text-red-500">{formState.errors.p_heart_rate.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.respiratoryRateLabel')}
            <input
              type="number"
              {...register('p_respiratory_rate')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_respiratory_rate && (
              <span className="text-xs text-red-500">{formState.errors.p_respiratory_rate.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.spo2Percent')}
            <input
              type="number"
              {...register('p_spo2')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_spo2 && (
              <span className="text-xs text-red-500">{formState.errors.p_spo2.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.weightKg')}
            <input
              type="number"
              step="0.1"
              {...register('p_weight_kg')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_weight_kg && (
              <span className="text-xs text-red-500">{formState.errors.p_weight_kg.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.heightCm')}
            <input
              type="number"
              step="0.1"
              {...register('p_height_cm')}
              className="input-field mt-2 w-full"
            />
            {formState.errors.p_height_cm && (
              <span className="text-xs text-red-500">{formState.errors.p_height_cm.message}</span>
            )}
          </label>

          <label className="block text-sm text-slate-700">
            {t('vitals.bmi')}
            <input
              type="number"
              step="0.1"
              {...register('p_bmi')}
              readOnly
              className="input-field mt-2 w-full bg-slate-100"
            />
          </label>
        </div>

        <label className="block text-sm text-slate-700">
          {t('common.notes')}
          <textarea
            {...register('p_notes')}
            rows={4}
            className="input-field mt-2 w-full resize-none"
            placeholder={t('vitals.optionalReadingNotes')}
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
            disabled={createVital.isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {createVital.isPending ? t('common.saving') : t('vitals.saveVitalSigns')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
