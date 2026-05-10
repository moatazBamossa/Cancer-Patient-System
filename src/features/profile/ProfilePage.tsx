import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Phone, ShieldCheck, Key } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { FormField } from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, role } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const profileSchema = z.object({
    full_name: z.string().min(1, t('profile.nameRequired')),
    phone: z.string().min(1, t('profile.phoneRequired')),
  });

  type ProfileForm = z.infer<typeof profileSchema>;

  const methods = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name || '', phone: user?.phone || '' },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsUpdating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call
      toast.success(t('profile.updateSuccess'));
    } catch {
      toast.error(t('profile.updateError'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-32 h-32 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-2xl"
               style={{ background: 'var(--accent-gradient)' }}>
            {user.full_name.charAt(0)}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{user.full_name}</h1>
            <p className="text-sm mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold">
              <ShieldCheck size={16} /> {role?.role_name || t('common.unknown')}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                <Phone size={16} /><span className="text-sm">{user.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-card p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <UserCircle size={20} className="text-indigo-500" /> {t('profile.accountDetails')}
          </h2>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="full_name" label={t('profile.fullName')} required />
                <div className="space-y-1.5 opacity-50 cursor-not-allowed">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('profile.username')}</label>
                  <input type="text" value={user.user_name} disabled className="input-field cursor-not-allowed" />
                </div>
                <FormField name="phone" label={t('profile.phone')} required />
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" disabled={isUpdating} className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-50">
                  {isUpdating ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          </FormProvider>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Key size={20} className="text-emerald-500" /> {t('profile.role')} & {t('common.status.label')}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('profile.accountStatus')}</p>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span className="text-sm font-bold text-emerald-500">{user.is_active ? t('profile.active') : t('profile.inactive')}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('profile.memberSince')}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
