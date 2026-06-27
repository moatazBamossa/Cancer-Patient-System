import React from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useVisitVitals, useDeleteVital, createVisitVitalsQueryKey } from '../hooks/useClinicVisits';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Tooltip } from './ui/Tooltip';
import type { VitalSignRpcItem } from '../types/visitRpc';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

interface RecordedVitalSignsProps {
  visitId: number | null;
  onAddVital: () => void;
}

export function RecordedVitalSigns({ visitId, onAddVital }: RecordedVitalSignsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: vitals = [], isLoading, error } = useVisitVitals(visitId);
  const deleteVital = useDeleteVital(visitId ?? 0);
  const [confirmVitalId, setConfirmVitalId] = React.useState<number | null>(null);

  const sortedVitals = React.useMemo(
    () => [...vitals].sort((a, b) => {
      const aDate = new Date(a.recorded_at ?? '').getTime();
      const bDate = new Date(b.recorded_at ?? '').getTime();
      return bDate - aDate;
    }),
    [vitals],
  );

  const handleDelete = async () => {
    if (!confirmVitalId) return;
    try {
      await deleteVital.mutateAsync(confirmVitalId);
      toast.success(t('vitals.vitalSignRecordDeleted'));
      setConfirmVitalId(null);
      queryClient.invalidateQueries({ queryKey: [createVisitVitalsQueryKey()[0]] });
    } catch (err) {
      toast.error((err as Error).message || t('vitals.unableDeleteVitalSign'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {t('vitals.recordedVitalSigns')}
          </h2>
          <p className="text-sm text-slate-500">{t('vitals.viewReadingsForSelectedVisit')}</p>
        </div>
        <Tooltip position="right" text={t('vitals.selectVisitBeforeAdding')} show={!visitId}>
          <button
            type="button"
            onClick={onAddVital}
            className={`${visitId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'} inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition`}
            disabled={!visitId}
          >
            {t('vitals.addVitalSigns')}
          </button>
        </Tooltip>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="rounded-2xl border p-4 animate-pulse" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div className="h-4 w-1/2 rounded bg-slate-300" />
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="h-16 rounded bg-slate-300" />
                <div className="h-16 rounded bg-slate-300" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border p-6" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          <p className="text-sm font-medium text-red-600">{t('vitals.unableLoadVitalSigns')}</p>
          <p className="text-sm text-slate-500">{error.message}</p>
        </div>
      ) : vitals.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          <p className="text-sm font-medium text-slate-700">{t('vitals.noVitalSignsRecordedForVisit')}</p>
          <p className="text-sm text-slate-500">{t('vitals.addNewReadingToTrackVitals')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedVitals.map((vital) => (
            <div
              key={vital.vital_id}
              className="rounded-3xl border p-5 shadow-sm"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.recorded_at ? format(new Date(vital.recorded_at), 'PPpp') : t('vitals.recordedReading')}
                  </p>
                  <p className="text-xs text-slate-500">{t('vitals.vitalSignSnapshot')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmVitalId(vital.vital_id)}
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  {t('common.delete')}
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.bloodPressure')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.blood_pressure_sys ?? '-'} / {vital.blood_pressure_dia ?? '-'} mmHg
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.heartRateLabel')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.heart_rate ?? '-'} bpm
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.temperatureLabel')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.temperature ?? '-'} °C
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.spo2')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.spo2 ?? '-'} %
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.respiratoryRateLabel')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.respiratory_rate ?? '-'} /min
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.weightLabel')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.weight_kg ?? '-'} kg
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.bmi')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {Number(vital.bmi).toFixed(2) ?? '-'}
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('vitals.height')}</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.height_cm ?? '-'}
                  </p>
                </div>
              </div>

              {vital.notes && (
                <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('common.notes')}</p>
                  <p className="mt-2 text-sm text-slate-700">{vital.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmVitalId}
        title={t('vitals.deleteVitalSignTitle')}
        message={t('vitals.deleteVitalSignMessage')}
        onClose={() => setConfirmVitalId(null)}
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
