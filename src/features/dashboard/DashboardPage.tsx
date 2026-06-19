import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Heart, Activity, Stethoscope,
  TrendingUp, Calendar, Plus, FileText, ArrowRight,
  ShieldAlert, UserCheck, CalendarDays, Award, ChevronRight, Copy, Check
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { rpcCall } from '../../utils/rpcCall';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await rpcCall<any>('dashboard_summary');
      const dataObj = Array.isArray(res) ? res[0] : res;
      return dataObj?.dashboard_summary || dataObj || null;
    },
  });

  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const handleCopyEmail = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success(t('common.copied', { defaultValue: 'Copied to clipboard!' }));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMonth = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(i18n.language, { month: 'short', year: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const translateVisitType = (type: string) => {
    const mapping: Record<string, string> = {
      'Follow-up': t('visits.type.followUp', { defaultValue: 'Follow-up' }),
      'consultation': t('visits.type.consultation', { defaultValue: 'Consultation' }),
      'treatment_session': t('visits.type.treatmentSession', { defaultValue: 'Treatment Session' }),
      'Routine': t('visits.type.routine', { defaultValue: 'Routine' }),
      'Emergency': t('visits.type.emergency', { defaultValue: 'Emergency' }),
    };
    return mapping[type] || type;
  };

  const stats = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: t('dashboard.totalPatients', { defaultValue: 'Total Patients' }),
        value: summary.totals?.total_patients || 0,
        subtext: `${summary.totals?.active_patients || 0} ${t('dashboard.active', { defaultValue: 'active' })}`,
        icon: Users,
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.08)'
      },
      {
        label: t('dashboard.totalVisits', { defaultValue: 'Total Visits' }),
        value: summary.totals?.total_visits || 0,
        subtext: `${summary.today?.total_visits || 0} ${t('dashboard.today', { defaultValue: 'today' })}`,
        icon: CalendarDays,
        color: '#ec4899',
        bg: 'rgba(236,72,153,0.08)'
      },
      {
        label: t('dashboard.cancerCases', { defaultValue: 'Cancer Cases' }),
        value: summary.cancer_stats?.total_cases || summary.totals?.total_cancer_cases || 0,
        subtext: t('dashboard.monitored', { defaultValue: 'Cases monitored' }),
        icon: Activity,
        color: '#14b8a6',
        bg: 'rgba(20,184,166,0.08)'
      },
      {
        label: t('dashboard.activeDiagnoses', { defaultValue: 'Active Diagnoses' }),
        value: summary.totals?.active_diagnoses || 0,
        subtext: `${summary.totals?.resolved_diagnoses || 0} ${t('dashboard.resolved', { defaultValue: 'resolved' })}`,
        icon: Stethoscope,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)'
      },
    ];
  }, [summary, t]);

  const quickActions = [
    { label: t('common.add') + ' ' + t('common.patient'), icon: Plus, path: '/patients', color: '#6366f1' },
    { label: t('common.diagnoses'), icon: Stethoscope, path: '/diagnoses', color: '#ec4899' },
    { label: t('common.visits'), icon: Calendar, path: '/visits', color: '#14b8a6' },
    { label: t('dashboard.viewReports'), icon: FileText, path: '/lab-tests', color: '#f59e0b' },
  ];

  const visitTypesChart = useMemo(() => {
    if (!summary?.visit_types) return [];
    const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];
    return summary.visit_types.map((vt: any, index: number) => ({
      name: translateVisitType(vt.visit_type),
      value: vt.count,
      percentage: vt.percentage,
      color: colors[index % colors.length],
    }));
  }, [summary, t]);

  const monthlyTrendChart = useMemo(() => {
    if (!summary?.monthly_trend) return [];
    return [...summary.monthly_trend]
      .reverse()
      .map((item: any) => ({
        name: formatMonth(item.month),
        visits: item.visits,
      }));
  }, [summary, i18n.language]);

  const demographicsAgeChart = useMemo(() => {
    if (!summary?.patient_demographics?.by_age_group) return [];
    const ageMap = summary.patient_demographics.by_age_group;
    return Object.keys(ageMap).map((key) => ({
      name: key,
      patients: ageMap[key],
    }));
  }, [summary]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center glass-card p-8">
        <ShieldAlert size={48} className="text-red-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.failedLoad', { defaultValue: 'Failed to load dashboard summary' })}
        </h3>
        <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
          {error?.message || t('dashboard.failedLoadSubtitle', { defaultValue: 'Please ensure database connections and permissions are configured correctly.' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden relative p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="absolute inset-0 pointer-events-none opacity-10"
             style={{ background: 'radial-gradient(circle at 10% 20%, rgba(99,102,241,0.2) 0%, transparent 40%)' }} />
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.welcomeBack', { defaultValue: 'Welcome back' })} 👋
          </h1>
          <p className="text-sm max-w-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t('dashboard.subtitle', { defaultValue: 'Here is what is happening at the Cancer Center today.' })}
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
               style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-primary)' }}>
            <Calendar size={14} />
            {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto relative z-10">
          {[
            { label: t('dashboard.visitsToday', { defaultValue: 'Visits Today' }), val: summary.today?.total_visits || 0, color: 'text-indigo-500' },
            { label: t('dashboard.completed', { defaultValue: 'Completed' }), val: summary.today?.completed_visits || 0, color: 'text-emerald-500' },
            { label: t('dashboard.missed', { defaultValue: 'Missed' }), val: summary.today?.missed_visits || 0, color: 'text-rose-500' },
            { label: t('dashboard.newPatients', { defaultValue: 'New Patients' }), val: summary.today?.new_patients || 0, color: 'text-amber-500' },
          ].map((act, i) => (
            <div key={i} className="p-3.5 rounded-2xl text-center min-w-[100px]" style={{ background: 'var(--bg-tertiary)' }}>
              <p className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{act.label}</p>
              <p className={`text-xl font-black ${act.color}`}>{act.val}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="glass-card p-5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {stat.subtext}
                </span>
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background: stat.bg }}>
                <stat.icon size={26} style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Block 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp size={18} className="text-indigo-500" />
              {t('dashboard.visitsTrend', { defaultValue: 'Visits Monthly Trend' })}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrendChart}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Calendar size={18} className="text-emerald-500" />
            {t('dashboard.visitTypes', { defaultValue: 'Appointment Types' })}
          </h3>
          <div className="relative flex justify-center items-center h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitTypesChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {visitTypesChart.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                {t('dashboard.total', { defaultValue: 'Total' })}
              </p>
              <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                {summary.totals?.total_visits || 0}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {visitTypesChart.map((vt: any) => (
              <div key={vt.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: vt.color }} />
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{vt.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{vt.value}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>({vt.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Block 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Activity size={18} className="text-rose-500" />
            {t('dashboard.cancerByType', { defaultValue: 'Cancer Cases by Type' })}
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary.cancer_stats?.by_type || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="cancer_name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                }}
              />
              <Bar dataKey="cases" fill="url(#colorCasesGrad)" radius={[6, 6, 0, 0]}>
                <defs>
                  <linearGradient id="colorCasesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Users size={18} className="text-amber-500" />
              {t('dashboard.genderDemographics', { defaultValue: 'Gender Split' })}
            </h3>
            {(() => {
              const male = summary.patient_demographics?.by_gender?.male || 0;
              const female = summary.patient_demographics?.by_gender?.female || 0;
              const total = male + female || 1;
              const malePct = Math.round((male / total) * 100);
              const femalePct = Math.round((female / total) * 100);
              return (
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-indigo-400">{t('patients.male', { defaultValue: 'Male' })} ({male})</span>
                      <span style={{ color: 'var(--text-primary)' }}>{malePct}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden w-full" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${malePct}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-rose-400">{t('patients.female', { defaultValue: 'Female' })} ({female})</span>
                      <span style={{ color: 'var(--text-primary)' }}>{femalePct}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden w-full" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${femalePct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <TrendingUp size={18} className="text-violet-500" />
              {t('dashboard.ageDemographics', { defaultValue: 'Age Distribution' })}
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={demographicsAgeChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={40} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="patients" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="glass-card p-6"
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('dashboard.quickActions')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-[var(--border-color)] text-left"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: `${action.color}12` }}>
                <action.icon size={22} style={{ color: action.color }} />
              </div>
              <div>
                <span className="text-xs font-semibold block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t('dashboard.action', { defaultValue: 'Action' })}
                </span>
                <span className="text-sm font-bold block mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {action.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Doctor Performance & Missed Visits Actionable block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 lg:col-span-2 overflow-x-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Award size={18} className="text-amber-500" />
              {t('dashboard.doctorPerformance', { defaultValue: 'Medical Staff Performance' })}
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t('common.doctor', { defaultValue: 'Doctor' })}
                </th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t('doctors.specialty', { defaultValue: 'Specialty' })}
                </th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
                  {t('dashboard.totalPatientsShort', { defaultValue: 'Patients' })}
                </th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
                  {t('dashboard.attendance', { defaultValue: 'Attendance' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.doctor_performance?.map((doc: any) => {
                const totalV = doc.total_visits || 0;
                const missedV = doc.missed_visits || 0;
                const completedV = totalV - missedV;
                const attendancePct = totalV > 0 ? Math.round((completedV / totalV) * 100) : 100;
                return (
                  <tr key={doc.doctor_id} className="border-b last:border-b-0 hover:bg-slate-500/5 transition-colors" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>{doc.doctor_name}</td>
                    <td className="py-3.5" style={{ color: 'var(--text-secondary)' }}>{doc.specialty}</td>
                    <td className="py-3.5 text-center font-semibold" style={{ color: 'var(--text-secondary)' }}>{doc.total_patients}</td>
                    <td className="py-3.5">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-20 bg-slate-500/10 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${attendancePct >= 80 ? 'bg-emerald-500' : attendancePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${attendancePct}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{attendancePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="glass-card p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={20} className="text-rose-500 animate-pulse" />
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.missedFollowUp', { defaultValue: 'Visits Follow-up' })}
              </h3>
            </div>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('dashboard.missedFollowUpDesc', { defaultValue: 'These patients missed their appointments. Action required to contact or reschedule.' })}
            </p>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {(summary.missed_visits?.list || []).map((visit: any) => (
                <div key={visit.visit_id} className="p-3 rounded-2xl border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{visit.patient_name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {t('common.doctor', { defaultValue: 'Dr.' })} {visit.doctor_name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyEmail(visit.patient_email, visit.visit_id)}
                      className="p-1.5 rounded-lg border transition-colors hover:bg-slate-500/10 flex items-center justify-center"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                    >
                      {copiedId === visit.visit_id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t text-[10px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    <span className="font-semibold bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded-md">
                      {visit.visit_type}
                    </span>
                    <span>•</span>
                    <span>{visit.next_visit_date}</span>
                  </div>
                </div>
              ))}
              {(!summary.missed_visits?.list || summary.missed_visits.list.length === 0) && (
                <div className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <UserCheck size={28} className="mx-auto mb-2 text-emerald-500" />
                  {t('dashboard.noMissedVisits', { defaultValue: 'All clean! No missed visits.' })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t mt-4" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => navigate('/upcoming-visits')}
              className="gradient-btn w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl"
            >
              {t('dashboard.viewAllUpcoming', { defaultValue: 'View Upcoming Schedule' })}
              <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
