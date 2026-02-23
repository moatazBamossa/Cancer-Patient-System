import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLng);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95',
        'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
        className
      )}
      title={i18n.language === 'en' ? 'Switch to Arabic' : 'تغيير للإنجليزية'}
    >
      <Languages size={18} />
      <span className="text-xs font-bold uppercase tracking-wider">
        {i18n.language === 'en' ? 'AR' : 'EN'}
      </span>
    </button>
  );
}
