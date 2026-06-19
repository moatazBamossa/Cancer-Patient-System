import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  Users,
  Activity,
  Stethoscope,
  Plus,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { rpcCall } from '../utils/rpcCall';
import { PageSkeleton } from '../components/ui/Skeleton';

// Permission mapping for each quick action
const QUICK_ACTION_PERMISSIONS = {
  '/patients': 'patient',
  '/patient-visits': 'clinic_visits_and_vitals',
  '/lab-tests': 'laboratory_tests',
  '/diagnoses': 'diagnoses',
} as const;

export default function WelcomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['welcomeSummary'],
    queryFn: async () => {
      const res = await rpcCall<any>('dashboard_summary');
      const dataObj = Array.isArray(res) ? res[0] : res;
      return dataObj?.dashboard_summary || dataObj || null;
    },
    staleTime: 5 * 60 * 1000,
  });
console.log("role", role);

  const userName = user?.full_name || t('common.user', { defaultValue: 'User' });
  const formattedDate = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      {
        title: t('welcome.upcomingVisits', { defaultValue: 'Upcoming Visits' }),
        value: summary.today?.total_visits || summary.totals?.total_visits || 0,
        icon: CalendarDays,
        accent: 'text-indigo-500',
      },
      {
        title: t('welcome.activePatients', { defaultValue: 'Active Patients' }),
        value: summary.totals?.total_patients || 0,
        icon: Users,
        accent: 'text-emerald-500',
      },
      {
        title: t('welcome.openCases', { defaultValue: 'Open Cases' }),
        value: summary.totals?.active_diagnoses || 0,
        icon: Stethoscope,
        accent: 'text-amber-500',
      },
      {
        title: t('welcome.tasks', { defaultValue: 'Pending Actions' }),
        value: summary.today?.new_patients || 0,
        icon: Activity,
        accent: 'text-pink-500',
      },
    ];
  }, [summary, t]);




  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-card overflow-hidden relative p-8 sm:p-10"
      >
        <div
          className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(236,72,153,0.16), transparent 28%)',
          }}
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr] items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Sparkles size={14} />
              {t('welcome.quickStart', { defaultValue: 'Quick start' })}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {t('welcome.greeting',{name:userName})}
            </h1>
            <p className="max-w-2xl text-base leading-7" style={{ color: 'var(--text-muted)' }}>
              {t('welcome.description', {
                defaultValue: 'Your command center is ready. Jump into patient care, review appointments, and keep the clinic workflow running smoothly.',
              })}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 p-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm text-slate-500">{t('welcome.today', { defaultValue: 'Today' })}</p>
                <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{formattedDate}</p>
              </div>
              <div className="rounded-3xl border border-white/10 p-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm text-slate-500">{t('welcome.role', { defaultValue: 'Your role' })}</p>
                <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.role_name || t('common.role', { defaultValue: 'Role' })}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[var(--bg-secondary)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t('welcome.todayFocus', { defaultValue: 'Today’s focus' })}
                </p>
                <h2 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t('welcome.reviewCarePlan', { defaultValue: 'Review the care plan and patient flow' })}
                </h2>
              </div>
              <div className="h-12 w-12 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Bell size={22} className="text-indigo-500" />
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-[var(--bg-tertiary)] p-4">
                <p className="text-sm text-slate-500">{t('welcome.nextAppointment', { defaultValue: 'Next appointment' })}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {summary?.today?.next_visit || t('welcome.noneScheduled', { defaultValue: 'No visits scheduled yet' })}
                </p>
              </div>
              <div className="rounded-3xl bg-[var(--bg-tertiary)] p-4">
                <p className="text-sm text-slate-500">{t('welcome.insight', { defaultValue: 'Insight' })}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {t('welcome.patientCareTip', { defaultValue: 'Start with the patients who have lab work pending and follow-up in the next 24 hours.' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.75fr]">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  {t('welcome.quickActions', { defaultValue: 'Quick actions' })}
                </p>
                <h2 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t('welcome.startNow', { defaultValue: 'Get work done faster' })}
                </h2>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  {t('welcome.focus', { defaultValue: 'Focus today' })}
                </p>
                <h2 className="mt-3 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {t('welcome.keepItOrganized', { defaultValue: 'Keep care organized' })}
                </h2>
              </div>
              <div className="rounded-3xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-500">
                {t('welcome.onTrack', { defaultValue: 'On track' })}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                t('welcome.task1', { defaultValue: 'Review your patients with appointments today.' }),
                t('welcome.task2', { defaultValue: 'Check the latest lab results and follow up.' }),
                t('welcome.task3', { defaultValue: 'Confirm medication orders for active cases.' }),
                t('welcome.task4', { defaultValue: 'Update any patient notes after consultations.' }),
              ].map((text) => (
                <div key={text} className="flex items-start gap-3 rounded-3xl bg-[var(--bg-secondary)] p-4" style={{ borderColor: 'var(--border-color)', borderWidth: 1 }}>
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <p className="text-sm text-slate-500 leading-6">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
