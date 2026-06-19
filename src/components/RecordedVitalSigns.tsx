import React from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useVisitVitals, useDeleteVital } from '../hooks/useClinicVisits';
import { ConfirmDialog } from './ui/ConfirmDialog';
import type { VitalSignRpcItem } from '../types/visitRpc';

interface RecordedVitalSignsProps {
  visitId: number | null;
  onAddVital: () => void;
}

export function RecordedVitalSigns({ visitId, onAddVital }: RecordedVitalSignsProps) {
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
      toast.success('Vital sign record deleted');
      setConfirmVitalId(null);
    } catch (err) {
      toast.error((err as Error).message || 'Unable to delete vital sign');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recorded vital signs
          </h2>
          <p className="text-sm text-slate-500">View readings captured for the selected visit.</p>
        </div>
        <button
          type="button"
          onClick={onAddVital}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          disabled={!visitId}
        >
          Add vital signs
        </button>
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
          <p className="text-sm font-medium text-red-600">Unable to load vital signs.</p>
          <p className="text-sm text-slate-500">{error.message}</p>
        </div>
      ) : vitals.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
          <p className="text-sm font-medium text-slate-700">No vital signs recorded for this visit.</p>
          <p className="text-sm text-slate-500">Add a new reading to keep tracking the patient’s vitals.</p>
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
                    {vital.recorded_at ? format(new Date(vital.recorded_at), 'PPpp') : 'Recorded reading'}
                  </p>
                  <p className="text-xs text-slate-500">Vital sign snapshot</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmVitalId(vital.vital_id)}
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Blood pressure</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.blood_pressure_sys ?? '-'} / {vital.blood_pressure_dia ?? '-'} mmHg
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Heart rate</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.heart_rate ?? '-'} bpm
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Temperature</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.temperature ?? '-'} °C
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SpO2</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.spo2 ?? '-'} %
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Respiratory rate</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.respiratory_rate ?? '-'} /min
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weight</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.weight_kg ?? '-'} kg
                  </p>
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Height / BMI</p>
                  <p className="mt-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {vital.height_cm ?? '-'} cm / {vital.bmi ?? '-'}
                  </p>
                </div>
              </div>

              {vital.notes && (
                <div className="mt-4 rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Notes</p>
                  <p className="mt-2 text-sm text-slate-700">{vital.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmVitalId}
        title="Delete vital sign"
        message="Are you sure you want to delete this vital sign record? This action cannot be undone."
        onClose={() => setConfirmVitalId(null)}
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
