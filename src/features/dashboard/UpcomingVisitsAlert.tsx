import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, Clock, Calendar, AlertCircle, X, Phone, User, ExternalLink } from 'lucide-react';
import { formatDateTime } from '../../lib/utils';
import { getUpcomingVisits } from '../../lib/visit-notifications';

const today = new Date();
today.setHours(0, 0, 0, 0);

interface UpcomingVisitsAlertProps {
  onViewPatient?: (patientId: number) => void;
}

export default function UpcomingVisitsAlert({ onViewPatient }: UpcomingVisitsAlertProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const upcomingVisits = getUpcomingVisits();

  if (dismissed || upcomingVisits.length === 0) return null;

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

        {/* Visit List */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 custom-scrollbar">
          {upcomingVisits.map((visit) => {
            const urgency = getUrgency(visit.visit_date);
            const phone = visit.patients.mobile_number || visit.patients.phone || '—';
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
                      {visit.patients.full_name}
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
                      {visit.doctors.full_name}
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
                      onClick={() => onViewPatient(visit.patients.patient_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <span>{t('upcomingVisits.view')}</span>
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
