import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Activity, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import type { LoginCredentials } from '../../types';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const isRtl = i18n.language === 'ar';

  const loginSchema = z.object({
    username: z.string().min(1, t('auth.usernameRequired', { defaultValue: 'Username is required' })),
    password: z.string().min(1, t('auth.passwordRequired', { defaultValue: 'Password is required' })),
  });

  const methods = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setError('');
    setIsLoading(true);
    try {
      const { user, role } = await authService.login(data);
      login(user, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'var(--bg-primary)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)' }} />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[50%] rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 sm:p-10 w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: 'var(--accent-gradient)' }}>
            <Activity size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isRtl ? 'مركز السرطان' : 'Cancer Center'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('auth.signIn')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.username')}
              </label>
              <input
                {...methods.register('username')}
                type="text"
                placeholder={t('auth.enterUsername')}
                className="input-field"
                autoComplete="username"
              />
              {methods.formState.errors.username && (
                <p className="text-xs text-red-500">{methods.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  {...methods.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.enterPassword')}
                  className={cn("input-field", isRtl ? "pl-10" : "pr-10")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 p-1", isRtl ? "left-3" : "right-3")}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {methods.formState.errors.password && (
                <p className="text-xs text-red-500">{methods.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="gradient-btn w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} className={isRtl ? "rotate-180" : ""} />
                  {t('auth.signIn')}
                </>
              )}
            </button>
          </form>
        </FormProvider>

        {/* Demo credentials */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            {t('auth.demoCredentials')}
          </p>
          <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <span className="font-medium">{isRtl ? 'المشرف:' : 'Admin:'}</span> admin / admin123
            </p>
            <p>
              <span className="font-medium">{isRtl ? 'الطبيب:' : 'Doctor:'}</span> dr.ahmed / doctor123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
