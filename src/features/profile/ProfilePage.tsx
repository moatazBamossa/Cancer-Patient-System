import React from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle, Phone, ShieldCheck, Key, Calendar, Clock,
  AtSign, Stethoscope, BadgeCheck, FileText, RefreshCw, AlertCircle,
} from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import { zodValidator } from '../../lib/zodValidator';
import { formatDate } from '../../lib/utils';
import {
  useUserProfileByIdQuery,
  useUpdateUserProfileMutation,
} from '../../hooks/useUserProfiles';
import { useRolesQuery } from '../../modules/roles/hooks/role.hooks';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, role } = useAppSelector((state) => state.auth);
  const { data: profile, isLoading, error } = useUserProfileByIdQuery(user?.id);
  const updateMutation = useUpdateUserProfileMutation();
  const { data: roles = [] } = useRolesQuery();

  const profileSchema = z.object({
    full_name: z.string().min(1, t('profile.nameRequired')),
    phone: z.string().min(1, t('profile.phoneRequired')),
    email: z.string().email(t('common.invalidEmail')).optional().or(z.literal('')),
  });

  type ProfileForm = z.infer<typeof profileSchema>;

  const profileName = profile?.full_name || user?.full_name || '';
  const profilePhone = profile?.phone || user?.phone || '';
  const profileUsername = profile?.user_name || user?.user_name || '';
  const profileRoleId =
    profile?.role_id != null ? profile.role_id : user?.role_id ? Number(user.role_id) : null;
  const profileIsActive = profile?.is_active ?? user?.is_active ?? true;
  const profileCreatedAt = profile?.created_at || user?.created_at || '';
  const profileSpecialty = profile?.specialty || user?.specialty || '';
  const profileUpdatedAt = profile?.updated_at || user?.updated_at || '';

  const getRoleName = (roleId: number | null) => {
    if (roleId == null) return t('common.unknown');
    const found = roles.find((r) => r.role_id === roleId);
    return found?.role_name || role?.role_name || t('common.unknown');
  };

  const profileEmail = profile?.email || user?.email || '';
  const profileInitialValues: ProfileForm = {
    full_name: profileName,
    phone: profilePhone,
    email: profileEmail,
  };

  const formKey = profile?.id || user?.id || 'profile';

  const onSubmit = async (data: ProfileForm) => {
    if (!user?.id) return;
    await updateMutation.mutateAsync({
      id: user.id,
      full_name: data.full_name,
      phone: data.phone || null,
      email: data.email?.trim() || null,
    });
  };

  if (!user) return null;

  const initials = profileName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isSaving = updateMutation.isPending;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* ──────────────────────── PROFILE HEADER ──────────────────────── */}
      <motion.div variants={item} className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-black text-white shadow-xl ring-4 ring-white/30">
                {isLoading ? (
                  <RefreshCw size={28} className="animate-spin" />
                ) : (
                  initials
                )}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                  profileIsActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              >
                <BadgeCheck size={12} className="text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                  {isLoading ? (
                    <span className="opacity-60 animate-pulse">{user.full_name}</span>
                  ) : (
                    profileName
                  )}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm shrink-0">
                  <ShieldCheck size={13} />
                  {getRoleName(profileRoleId)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1 mt-3 text-white/80 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <AtSign size={13} />
                  {profileUsername}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={13} />
                  {profilePhone || t('common.notAvailable')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <AtSign size={13} />
                  {profileEmail || t('common.notAvailable')}
                </span>
                {profileSpecialty && (
                  <span className="inline-flex items-center gap-1.5">
                    <Stethoscope size={13} />
                    {profileSpecialty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ──────────────────────── ERROR ──────────────────────── */}
      {error && (
        <motion.div
          variants={item}
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2"
        >
          <AlertCircle size={16} />
          {error.message || t('profile.loadError')}
        </motion.div>
      )}

      {/* ──────────────────────── MAIN GRID ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── EDIT FORM ── */}
        <motion.div variants={item} className="lg:col-span-2">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <UserCircle size={20} className="text-indigo-500" />
              {t('profile.accountDetails')}
            </h2>
            <AppForm<ProfileForm>
              key={formKey}
              formKey={formKey}
              initialValues={profileInitialValues}
              validate={zodValidator(profileSchema)}
              onSubmit={onSubmit}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  name="full_name"
                  label={t('profile.fullName')}
                  placeholder={t('profile.fullName')}
                  required
                />

                {/* Username – readonly */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {t('profile.username')}
                  </label>
                  <div className="relative">
                    <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={profileUsername}
                      disabled
                      className="input-field pl-9 w-full cursor-not-allowed opacity-70"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">{t('profile.usernameReadonly')}</p>
                </div>

                <FormField
                  name="phone"
                  label={t('profile.phone')}
                  placeholder={t('profile.phonePlaceholder')}
                  required
                />

                <FormField
                  name="email"
                  label={t('common.email')}
                  placeholder={t('profile.emailPlaceholder', { defaultValue: 'Enter your email address' })}
                />

                {/* Role – readonly */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {t('common.role')}
                  </label>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={getRoleName(profileRoleId)}
                      disabled
                      className="input-field pl-9 w-full cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={12} className="inline mr-1" />
                  {t('profile.memberSince')}: {profileCreatedAt ? formatDate(profileCreatedAt) : '—'}
                </p>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="gradient-btn px-6 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <FileText size={15} />
                  )}
                  {isSaving ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </AppForm>
          </div>
        </motion.div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-5">
          {/* Role & Status */}
          <motion.div variants={item}>
            <div className="glass-card p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <Key size={16} className="text-emerald-500" />
                {t('profile.roleAndStatus')}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {t('common.role')}
                  </p>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {getRoleName(profileRoleId)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {t('profile.accountStatus')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        profileIsActive
                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-bold ${
                        profileIsActive ? 'text-emerald-500' : 'text-slate-500'
                      }`}
                    >
                      {profileIsActive ? t('profile.active') : t('profile.inactive')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div variants={item}>
            <div className="glass-card p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <Clock size={16} className="text-amber-500" />
                {t('profile.timeline')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar size={14} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {t('profile.memberSince')}
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {profileCreatedAt ? formatDate(profileCreatedAt) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={14} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {t('profile.lastUpdated')}
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {profileUpdatedAt ? formatDate(profileUpdatedAt) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security hint */}
          <motion.div variants={item}>
            <div className="glass-card p-6">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <Key size={16} className="text-rose-500" />
                {t('profile.security')}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('profile.securityHint')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
