import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import UpcomingVisitsAlert from '../dashboard/UpcomingVisitsAlert';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UpcomingVisitsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="text-indigo-500" size={28} />
              {t('upcomingVisits.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('upcomingVisits.subtitle_full', { defaultValue: 'Detailed view of all patients scheduled in the next 48 hours.' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Alert Component (Reused) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <UpcomingVisitsAlert onViewPatient={(id) => navigate(`/patients/${id}`)} />
      </motion.div>

      {/* Empty State / Info */}
      <div className="glass-card p-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 font-bold text-xl uppercase">
          MD
        </div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('upcomingVisits.keepTrack', { defaultValue: 'Stay Ahead of Schedule' })}
        </h3>
        <p className="text-sm max-w-md mt-2" style={{ color: 'var(--text-muted)' }}>
          {t('upcomingVisits.trackDesc', { defaultValue: 'This page aggregates all urgent visits across the clinic to help you prepare for patient arrivals.' })}
        </p>
      </div>
    </div>
  );
}
