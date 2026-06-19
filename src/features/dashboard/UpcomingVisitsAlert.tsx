import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, Clock, Calendar, AlertCircle, X, Phone, User, ExternalLink, Filter, RefreshCcw } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { useClinicVisitsUpcoming } from '../../hooks/useClinicVisits';
import { doctorService } from '../../services/doctor.service';
import { diagnosisService } from '../../services/diagnosis.service';
import { patientService } from '../../services/patient.service';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import type { ClinicVisitsUpcomingFilters } from '../../types/visitRpc';

const today = new Date();
today.setHours(0, 0, 0, 0);

interface UpcomingVisitsAlertProps {
  onViewPatient?: (patientId: number) => void;
}

export default function UpcomingVisitsAlert({ onViewPatient }: UpcomingVisitsAlertProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [filterValues, setFilterValues] = useState<ClinicVisitsUpcomingFilters>({});

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', 'upcoming-visits-filters'],
    queryFn: () => doctorService.getAll(),
    staleTime: 1000 * 60 * 10,
  });

  const { data: patientsPage } = useQuery({
    queryKey: ['patients', 'upcoming-visits-filters'],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 250 }),
    staleTime: 1000 * 60 * 10,
  });
  const patients = patientsPage?.data ?? [];

  const { data: diagnosesPage } = useQuery({
    queryKey: ['diagnoses', 'upcoming-visits-filters'],
    queryFn: () => diagnosisService.getAll({ page: 1, pageSize: 250 }),
    staleTime: 1000 * 60 * 10,
  });
  const diagnoses = diagnosesPage?.data ?? [];

  const { data: upcomingVisits = [], isLoading: upcomingLoading } = useClinicVisitsUpcoming(filterValues);

  const activeFilterCount = useMemo(
    () =>
      Object.values(filterValues).filter((value) => value !== undefined && value !== null && value !== '').length,
    [filterValues],
  );

  const doctorOptions = useMemo(
    () => doctors.map((doctor) => ({ value: String(doctor.doctor_id), label: doctor.full_name || `Doctor ${doctor.doctor_id}` })),
    [doctors],
  );

  const patientOptions = useMemo(
    () =>
      [...patients]
        .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
        .map((patient) => ({ value: String(patient.patient_id), label: patient.full_name || `Patient ${patient.patient_id}` })),
    [patients],
  );

  const diagnosisOptions = useMemo(
    () =>
      diagnoses.map((diagnosis) => ({
        value: String(diagnosis.diagnosis_id),
        label: diagnosis.cancer_name ?? diagnosis.notes ?? `Diagnosis ${diagnosis.diagnosis_id}`,
      })),
    [diagnoses],
  );

  const handleApplyFilters = (values: ClinicVisitsUpcomingFilters) => {
    setFilterValues(values);
  };

  const handleResetFilters = () => {
    setFilterValues({});
  };

  if (dismissed) return null;

  const getUrgency = (visitDate: number | string | Date) => {
    const visit = new Date(visitDate);
    const startOfToday = new Date(today);
    const diffMs = visit.getTime() - startOfToday.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { label: t('upcomingVisits.today'), color: 'red', icon: AlertCircle };
    if (diffDays === 1) return { label: t('upcomingVisits.tomorrow'), color: 'amber', icon: Clock };
    return { label: t('upcomingVisits.in2days'), color: 'blue', icon: Calendar };
  };

  const formatDate = (ts: number | string | Date) => formatDateTime(String(ts));

  const colorMap = {
    red: {
      bg: 'rgba(239, 68, 68, 0.1)',
      text: '#ef4444',
      badgeBg: 'rgba(239, 68, 68, 0.2)',
      border: '#ef4444',
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.1)',
      text: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.2)',
      border: '#f59e0b',
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#3b82f6',
      badgeBg: 'rgba(59, 130, 246, 0.2)',
      border: '#3b82f6',
    },
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card overflow-hidden mb-6 border-l-4 border-l-indigo-500"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('upcomingVisits.title')}</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('upcomingVisits.subtitle', { count: upcomingVisits.length })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500">
              {t('upcomingVisits.visitsBadge', { count: upcomingVisits.length })}
            </span>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Dismiss"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Filter size={16} />
              <span className="font-medium">Refine upcoming visits</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <RefreshCcw size={16} />
                Reset filters
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {activeFilterCount === 0 ? 'All visits' : `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          <AppForm<ClinicVisitsUpcomingFilters>
            formKey={JSON.stringify(filterValues)}
            initialValues={filterValues}
            onSubmit={handleApplyFilters}
            className="mt-4"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name="p_from_visit_date"
                  label="Visit date from"
                  type="date"
                  placeholder="Start date"
                />
                <FormField
                  name="p_to_visit_date"
                  label="Visit date to"
                  type="date"
                  placeholder="End date"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name="p_from_next_date"
                  label="Next visit from"
                  type="date"
                  placeholder="Start date"
                />
                <FormField
                  name="p_to_next_date"
                  label="Next visit to"
                  type="date"
                  placeholder="End date"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <FormField
                name="p_doctor_id"
                label="Doctor"
                type="select"
                options={doctorOptions}
                placeholder="All doctors"
              />
              <FormField
                name="p_diagnosis_id"
                label="Diagnosis"
                type="select"
                options={diagnosisOptions}
                placeholder="All diagnoses"
              />
              <FormField
                name="p_patient_id"
                label="Patient"
                type="select"
                options={patientOptions}
                placeholder="All patients"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                Apply filters
              </button>
            </div>
          </AppForm>
        </div>

        {/* Visit List */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 custom-scrollbar">
          {upcomingLoading ? (
            <div className="p-6 text-center text-sm text-slate-500">Loading upcoming visits...</div>
          ) : upcomingVisits.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              {activeFilterCount > 0
                ? 'No visits match your filter selection. Adjust the filters or reset to show all upcoming visits.'
                : 'No upcoming visits are available at the moment.'}
            </div>
          ) : (
            upcomingVisits.map((visit: any) => {
              const urgency = getUrgency(visit.visit_date);
              const patientName = visit.patients?.full_name || visit.patient_name || visit.patient_full_name || '—';
              const phone = visit.patients?.mobile_number || visit.patients?.phone || visit.patient_mobile || visit.patient_phone || '—';
              const doctorName = visit.doctors?.full_name || visit.doctor_name || visit.doctor_full_name || '—';
              const colors = colorMap[urgency.color as keyof typeof colorMap];
              const Icon = urgency.icon;

              return (
                <div
                  key={visit.visit_id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group relative"
                  style={{ borderLeftColor: colors.text, borderLeftWidth: '4px', borderLeftStyle: 'solid' }}
                >
                  {/* Status Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`} style={{ background: colors.bg, color: colors.text }}>
                    <Icon size={16} />
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {patientName}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`} style={{ background: colors.badgeBg, color: colors.text }}>
                        {urgency.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-400" />
                        {formatDate(visit.visit_date)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>{visit.visit_type}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-emerald-400" />
                        {doctorName}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="flex items-center gap-2 group/phone">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Phone size={14} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {phone}
                      </span>
                    </div>

                    {onViewPatient && (
                      <button
                        onClick={() => onViewPatient(visit.patients?.patient_id ?? visit.patient_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <span>{t('upcomingVisits.view')}</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
