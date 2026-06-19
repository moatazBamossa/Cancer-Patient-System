import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-card p-10 text-center max-w-md"
      >
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <ShieldX size={64} style={{ color: 'white' }} />
        </div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('permissions.accessDenied')}
        </h1>

        <p
          className="text-base mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('permissions.accessDeniedMessage')}
        </p>

        <p
          className="text-sm mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('permissions.contactAdmin')}
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="gradient-btn inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
        >
          <ArrowLeft size={18} />
          {t('permissions.goToDashboard')}
        </button>
      </motion.div>
    </div>
  );
};

export { AccessDenied };
