import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, CheckCircle2, XCircle, UserPlus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Mock roles (from roles table)
const MOCK_ROLES = [
  { role_id: 1, role_name: 'Admin' },
  { role_id: 2, role_name: 'Doctor' },
  { role_id: 3, role_name: 'Nurse' },
  { role_id: 4, role_name: 'Lab Technician' },
  { role_id: 5, role_name: 'Radiologist' }
];

// Mock existing users (to show in list and check uniqueness)
const MOCK_EXISTING_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    full_name: 'Ahmed Al-Rashidi',
    user_name: 'ahmed_rashidi',
    role_id: 1,
    role_name: 'Admin',
    specialty: null,
    phone: '0501234567',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    full_name: 'Dr. Mohammed Saleh',
    user_name: 'dr_mohammed',
    role_id: 2,
    role_name: 'Doctor',
    specialty: 'Oncology',
    phone: '0502345678',
    is_active: true,
    created_at: '2024-01-20T14:15:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    full_name: 'Sara Hassan',
    user_name: 'sara_hassan',
    role_id: 3,
    role_name: 'Nurse',
    specialty: null,
    phone: '0503456789',
    is_active: true,
    created_at: '2024-02-05T09:00:00Z'
  }
];

// Validations
const validateFullName = (name: string) => {
  if (!name || name.trim().length < 3) return 'addUsers.validation.nameMin';
  if (name.length > 100) return 'addUsers.validation.nameMax';
  return null;
};

const validateUsername = (username: string) => {
  if (!username || username.length < 4) return 'addUsers.validation.usernameMin';
  if (username.length > 50) return 'addUsers.validation.usernameMax';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'addUsers.validation.usernameFormat';
  const exists = MOCK_EXISTING_USERS.some(u => u.user_name.toLowerCase() === username.toLowerCase());
  if (exists) return 'addUsers.validation.usernameTaken';
  return null;
};

const validatePassword = (password: string) => {
  if (!password || password.length < 8) return 'addUsers.validation.passwordMin';
  if (!/[A-Z]/.test(password)) return 'addUsers.validation.passwordUpper';
  if (!/[0-9]/.test(password)) return 'addUsers.validation.passwordNumber';
  if (!/[!@#$%^&*()_+\-\=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'addUsers.validation.passwordSpecial';
  return null;
};

const validatePasswordMatch = (password: string, confirmPassword: string) => {
  if (password !== confirmPassword) return 'addUsers.validation.passwordMatch';
  return null;
};

const validateEmail = (email: string) => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'addUsers.validation.emailFormat';
  return null;
};

const validatePhone = (phone: string) => {
  if (!phone) return null;
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 9)
    return 'addUsers.validation.phoneFormat';
  return null;
};

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (!password) return { level: 0, labelKey: 'addUsers.passwordStrength.noPassword', color: 'bg-gray-200', text: 'text-gray-500' };

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-\=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  const levels = [
    { level: 0, labelKey: 'addUsers.passwordStrength.noPassword', color: 'bg-gray-200', text: 'text-gray-500' },
    { level: 1, labelKey: 'addUsers.passwordStrength.weak', color: 'bg-red-500', text: 'text-red-500' },
    { level: 2, labelKey: 'addUsers.passwordStrength.fair', color: 'bg-orange-500', text: 'text-orange-500' },
    { level: 3, labelKey: 'addUsers.passwordStrength.good', color: 'bg-yellow-500', text: 'text-yellow-600' },
    { level: 4, labelKey: 'addUsers.passwordStrength.strong', color: 'bg-green-500', text: 'text-green-500' },
    { level: 5, labelKey: 'addUsers.passwordStrength.veryStrong', color: 'bg-green-600', text: 'text-green-600' }
  ];
  return levels[strength];
};

export default function AddUsersPage() {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    full_name: '',
    user_name: '',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
    role_id: 2,
    specialty: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usersCreated, setUsersCreated] = useState<any[]>(MOCK_EXISTING_USERS.slice(0, 5));
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleUsernameBlur = () => {
    const error = validateUsername(formData.user_name);
    if (error) {
      setErrors(prev => ({ ...prev, user_name: error }));
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: '',
      user_name: '',
      password: '',
      confirm_password: '',
      email: '',
      phone: '',
      role_id: 2,
      specialty: '',
      is_active: true
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    const newErrors: Record<string, string | null> = {};
    newErrors.full_name = validateFullName(formData.full_name);
    newErrors.user_name = validateUsername(formData.user_name);
    newErrors.password = validatePassword(formData.password);
    newErrors.confirm_password = validatePasswordMatch(formData.password, formData.confirm_password);
    newErrors.email = validateEmail(formData.email);
    newErrors.phone = validatePhone(formData.phone);

    if ([2, 5].includes(Number(formData.role_id)) && !formData.specialty.trim()) {
      newErrors.specialty = 'addUsers.validation.specialtyRequired';
    }

    Object.keys(newErrors).forEach(key => newErrors[key] === null && delete newErrors[key]);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors as Record<string, string>);
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newUser = {
        id: 'uuid-' + Math.random().toString(36).substr(2, 9),
        full_name: formData.full_name,
        user_name: formData.user_name,
        role_id: Number(formData.role_id),
        role_name: MOCK_ROLES.find(r => r.role_id === Number(formData.role_id))?.role_name,
        specialty: formData.specialty || null,
        phone: formData.phone || null,
        is_active: formData.is_active,
        created_at: new Date().toISOString()
      };

      setUsersCreated(prev => [newUser, ...prev]);
      setSuccessMessage(t('addUsers.successMessage', { name: formData.full_name }));

      // Clear timer for success message
      setTimeout(() => setSuccessMessage(''), 5000);
      handleReset();
    } catch (err) {
      setGeneralError(t('addUsers.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
             style={{ background: 'var(--accent-gradient)' }}>
          <UserPlus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('addUsers.title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('addUsers.subtitle')}
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Form */}
        <div className="flex-1 w-full lg:w-[60%]">
          <div className="rounded-xl border shadow-sm p-6" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            
            {successMessage && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />
                  <p className="text-green-600 dark:text-green-400 font-medium text-sm">{successMessage}</p>
                </div>
                <button onClick={() => setSuccessMessage('')} className="text-green-500/70 hover:text-green-500">
                  <X size={16} />
                </button>
              </div>
            )}

            {generalError && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
                  <p className="text-red-600 dark:text-red-400 font-medium text-sm">{generalError}</p>
                </div>
                <button onClick={() => setGeneralError('')} className="text-red-500/70 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="full_name" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder={t('addUsers.placeholders.fullName')}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                      errors.full_name ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                  {errors.full_name && <span className="text-xs text-red-500 mt-1">{t(errors.full_name)}</span>}
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="user_name" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.username')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="user_name"
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleInputChange}
                    onBlur={handleUsernameBlur}
                    placeholder={t('addUsers.placeholders.username')}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                      errors.user_name ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                  {errors.user_name && <span className="text-xs text-red-500 mt-1">{t(errors.user_name)}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="password" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={t('addUsers.placeholders.password')}
                      className={cn(
                        "w-full px-3 py-2 pr-10 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                        errors.password ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                      )}
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs text-red-500 mt-1">{t(errors.password)}</span>}
                  
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <div 
                          className={cn("h-full transition-all duration-300", passwordStrength.color)} 
                          style={{ width: `${(passwordStrength.level / 5) * 100}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", passwordStrength.text)}>
                        {t(passwordStrength.labelKey)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="confirm_password" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.confirmPassword')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirm_password"
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      placeholder={t('addUsers.placeholders.confirmPassword')}
                      className={cn(
                        "w-full px-3 py-2 pr-10 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                        errors.confirm_password ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                      )}
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                  {errors.confirm_password && <span className="text-xs text-red-500 mt-1">{t(errors.confirm_password)}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="email" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('addUsers.placeholders.email')}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                      errors.email ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                  {errors.email && <span className="text-xs text-red-500 mt-1">{t(errors.email)}</span>}
                </div>

                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="phone" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.phone')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('addUsers.placeholders.phone')}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                      errors.phone ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                    style={{ color: 'var(--text-primary)' }}
                  />
                  {errors.phone && <span className="text-xs text-red-500 mt-1">{t(errors.phone)}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 flex flex-col">
                  <label htmlFor="role_id" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {t('addUsers.role')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role_id"
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 border-[var(--border-color)]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {MOCK_ROLES.map(role => (
                      <option key={role.role_id} value={role.role_id} className="bg-white dark:bg-slate-900 text-black dark:text-white">
                        {/* Optionally localize role names if they are static keys, else use raw */}
                        {t(`common.${role.role_name.toLowerCase()}`, { defaultValue: role.role_name }) as string}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Specialty */}
                <div className={cn("space-y-1.5 flex flex-col transition-opacity", [2, 5].includes(Number(formData.role_id)) ? "opacity-100" : "opacity-0 pointer-events-none")}>
                  {[2, 5].includes(Number(formData.role_id)) && (
                    <>
                      <label htmlFor="specialty" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {t('addUsers.specialty')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="specialty"
                        type="text"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleInputChange}
                        placeholder={t('addUsers.placeholders.specialty')}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-all focus:ring-2",
                          errors.specialty ? "border-red-500 focus:ring-red-500/20" : "border-[var(--border-color)] focus:border-indigo-500 focus:ring-indigo-500/20"
                        )}
                        style={{ color: 'var(--text-primary)' }}
                      />
                      {errors.specialty && <span className="text-xs text-red-500 mt-1">{t(errors.specialty)}</span>}
                    </>
                  )}
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="is_active"
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all dark:border-gray-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  {t('addUsers.activeAccount')}
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t('addUsers.reset')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg font-medium text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    t('addUsers.createUser')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Recent Users */}
        <div className="flex-1 w-full lg:w-[40%]">
          <div className="rounded-xl border shadow-sm flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {t('addUsers.recentUsers')} ({usersCreated.length})
              </h2>
            </div>
            
            <div className="p-0 overflow-x-auto flex-1 h-full">
              {usersCreated.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-center h-full text-slate-400">
                  <UserPlus className="w-12 h-12 mb-3 opacity-20" />
                  <p>{t('addUsers.noUsers')}</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-100 dark:bg-slate-800/50" style={{ color: 'var(--text-muted)' }}>
                    <tr>
                      <th className="px-4 py-3 font-medium rounded-tl-lg">{t('addUsers.fullName')}</th>
                      <th className="px-4 py-3 font-medium">{t('addUsers.role')}</th>
                      <th className="px-4 py-3 font-medium">{t('addUsers.status')}</th>
                      <th className="px-4 py-3 font-medium rounded-tr-lg hidden sm:table-cell">{t('addUsers.created')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {usersCreated.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {user.full_name}
                          <div className="text-xs sm:hidden font-normal" style={{ color: 'var(--text-muted)' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                          {t(`common.${String(user.role_name || '').toLowerCase()}`, { defaultValue: user.role_name || 'User' }) as string}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                            user.is_active 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          )}>
                            {user.is_active ? t('addUsers.active') : t('addUsers.inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
