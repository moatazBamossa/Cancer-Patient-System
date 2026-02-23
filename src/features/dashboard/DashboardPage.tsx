import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Heart, Activity, Stethoscope,
  TrendingUp, Calendar, Plus, FileText, ArrowRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getDataStore } from '../../services/mockApi';
import { activityService } from '../../services/general.service';
import { formatDateTime } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { PageSkeleton } from '../../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const store = getDataStore();

  const isRtl = i18n.language === 'ar';

  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => activityService.getRecent(8),
  });

  if (isLoading) return <PageSkeleton />;

  // Stats
  const totalPatients = store.patients.filter((p) => !p.is_deleted).length;
  const activePlans = store.treatment_plans.filter((tp) => tp.status === 'ongoing').length;
  const activeCycles = store.treatment_cycles.filter((tc) => tc.status === 'in_progress').length;
  const totalDiagnoses = store.diagnoses.length;

  // Diagnoses by cancer type
  const cancerTypeMap = new Map(store.cancer_types.map((ct) => [ct.id, ct]));
  const diagByCancer = store.cancer_types.map((ct) => ({
    name: ct.name,
    value: store.diagnoses.filter((d) => d.cancer_type_id === ct.id).length,
    color: ct.color,
  })).filter((d) => d.value > 0);

  // Monthly visits
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const visitsByMonth = months.map((month, idx) => ({
    month,
    visits: store.clinic_visits.filter((v) => new Date(v.visit_date).getMonth() === idx).length,
  }));

  const stats = [
    { label: t('dashboard.totalPatients'), value: totalPatients, icon: Users, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { label: t('dashboard.activePlans'), value: activePlans, icon: Heart, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { label: t('dashboard.activeCycles'), value: activeCycles, icon: Activity, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
    { label: t('dashboard.totalDiagnoses'), value: totalDiagnoses, icon: Stethoscope, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  const quickActions = [
    { label: t('common.add') + ' ' + t('common.patients').slice(0, -1), icon: Plus, path: '/patients?action=add', color: '#6366f1' },
    { label: t('common.diagnoses'), icon: Stethoscope, path: '/diagnoses?action=add', color: '#ec4899' },
    { label: t('common.visits'), icon: Calendar, path: '/visits?action=add', color: '#14b8a6' },
    { label: t('dashboard.viewReports'), icon: FileText, path: '/lab-tests', color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {isRtl ? 'مرحباً بك مجدداً، ' : 'Welcome back, '} {user?.full_name?.split(' ')[0]} 👋
        </motion.h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                   style={{ background: stat.bg }}>
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-xs text-emerald-500 font-medium">+12%</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isRtl ? 'مقارنة بالشهر الماضي' : 'vs last month'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Diagnoses by Cancer Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('diagnoses.byType', { defaultValue: 'Diagnoses by Cancer Type' })}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={diagByCancer}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {diagByCancer.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Visits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.monthlyVisits', { defaultValue: 'Monthly Clinic Visits' })}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={visitsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="visits" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.quickActions')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: `${action.color}15` }}>
                  <action.icon size={20} style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('dashboard.recentActivity')}
            </h3>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: 'var(--accent-primary)' }}
            >
              {t('dashboard.viewAll')} <ArrowRight size={12} className={isRtl ? "rotate-180" : ""} />
            </button>
          </div>
          <div className="space-y-3">
            {activities?.slice(0, 6).map((activity) => {
              const actUser = store.users.find((u) => u.id === activity.user_id);
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                     style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                       style={{ background: 'var(--accent-gradient)' }}>
                    {actUser ? actUser.full_name.charAt(0) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {activity.description}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
