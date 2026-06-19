import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NoListPermissionProps {
  module: string;
}

const NoListPermission: React.FC<NoListPermissionProps> = ({ module }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-card p-8 text-center max-w-lg mx-auto mt-8"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{
          background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
        }}
      >
        <Lock size={48} style={{ color: 'var(--accent-primary)' }} />
      </div>

      <p
        className="text-base font-medium mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('permissions.noListPermission', { module })}
      </p>

      <p
        className="text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {t('permissions.noListPermissionSubtitle')}
      </p>
    </motion.div>
  );
};

export { NoListPermission };
