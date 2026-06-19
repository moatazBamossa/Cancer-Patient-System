import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientService } from '../services/patient.service';
import { PageSkeleton } from '../components/ui/Skeleton';
import type { Patient } from '../types';
import { useTranslation } from 'react-i18next';

export default function PatientVisitsLanding() {
  const { t } = useTranslation();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: patients = [], isLoading, error } = useQuery<Patient[], Error>({
    queryKey: ['patient-visits-patients'],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 250 }).then((result) => result.data),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].patient_id);
    }
  }, [patients, selectedPatientId]);

  const handleOpenVisits = () => {
    if (selectedPatientId) {
      navigate(`/patients/${selectedPatientId}/visits`);
    }
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <p className="text-sm font-semibold text-red-600">Unable to load patients.</p>
        <p className="text-sm text-slate-500">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('common.patientVisits')}
          </h1>
          <p className="text-sm text-slate-500">Select a patient to manage visits and vital signs.</p>
        </div>

        <button
          type="button"
          onClick={handleOpenVisits}
          disabled={!selectedPatientId}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {selectedPatientId ? 'Open visits' : 'Select a patient'}
        </button>
      </div>

      <div className="rounded-3xl border p-6" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}>
        <label className="block text-sm font-medium text-slate-700">
          Choose patient
          <select
            value={selectedPatientId ?? ''}
            onChange={(event) => setSelectedPatientId(event.target.value || null)}
            className="input-field mt-2 w-full"
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.patient_id} value={patient.patient_id}>
                {patient.full_name} ({patient.patient_id})
              </option>
            ))}
          </select>
        </label>

        {patients.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No patients available to show visits.
          </div>
        )}
      </div>
    </div>
  );
}
