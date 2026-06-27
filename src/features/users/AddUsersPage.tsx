import React, { useEffect, useMemo, useState } from 'react';
import { Field } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Eye, Edit2, Trash2, Search, X, Users, UserCheck, UserX } from 'lucide-react';
import { AppForm } from '../../components/ui/AppForm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { z } from 'zod';
import { zodValidator } from '../../lib/zodValidator';
import { cn } from '../../lib/utils';
import { useRolesQuery } from '../../modules/roles/hooks/role.hooks';
import {
  useCreateUserProfileMutation,
  useDeleteUserProfileMutation,
  useUpdateUserProfileMutation,
  useUserProfilesQuery,
} from '../../hooks/useUserProfiles';
import type { UserProfile } from '../../utils/user-profile-normalizers';
import type { CreateUserProfileParams, UpdateUserProfileParams } from '../../types/user-profile';
import { useModulePermissions } from '../../modules/roles/permissions';

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-rose-500/10 text-rose-600 border-rose-200',
  doctor: 'bg-blue-500/10 text-blue-600 border-blue-200',
  nurse: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  staff: 'bg-amber-500/10 text-amber-600 border-amber-200',
  super_admin: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

const phoneSchema = (t: ReturnType<typeof useTranslation>['t']) => z
  .union([
    z
      .string()
      .regex(/^[\d\s\-\+\(\)]+$/, t('addUsers.invalidPhone'))
      .refine((value) => !value || value.replace(/\D/g, '').length >= 9, t('addUsers.invalidPhone')),
    z.literal(''),
    z.undefined(),
  ])
  .optional();

const createUserSchema = (t: ReturnType<typeof useTranslation>['t']) => z
  .object({
    full_name: z.string().min(3, t('addUsers.fullNameMin')).max(100),
    user_name: z.string().min(4, t('addUsers.usernameMin')).max(50).regex(/^[a-zA-Z0-9_]+$/, t('addUsers.usernamePattern')),
    password: z
      .string()
      .min(8, t('addUsers.passwordMin'))
      .regex(/[A-Z]/, t('addUsers.passwordUppercase'))
      .regex(/[0-9]/, t('addUsers.passwordNumber'))
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, t('addUsers.passwordSpecial')),
    confirm_password: z.string(),
    phone: phoneSchema(t),
    role_id: z.number().nullable().optional(),
    specialty: z.string().optional(),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: t('addUsers.passwordsDoNotMatch'),
    path: ['confirm_password'],
  });

const editUserSchema = (t: ReturnType<typeof useTranslation>['t']) => z
  .object({
    full_name: z.string().min(3, t('addUsers.fullNameMin')).max(100),
    user_name: z.string().min(4, t('addUsers.usernameMin')).max(50).regex(/^[a-zA-Z0-9_]+$/, t('addUsers.usernamePattern')),
    password: z.string().optional(),
    confirm_password: z.string().optional(),
    phone: phoneSchema(t),
    role_id: z.number().nullable().optional(),
    specialty: z.string().optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const password = data.password?.trim();
    const confirmPassword = data.confirm_password?.trim();

    if (password || confirmPassword) {
      if (!password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('auth.passwordRequired'), path: ['password'] });
      }
      if (!confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.confirmPasswordRequired'), path: ['confirm_password'] });
      }
      if (password && password.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.passwordMin'), path: ['password'] });
      }
      if (password && !/[A-Z]/.test(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.passwordUppercase'), path: ['password'] });
      }
      if (password && !/[0-9]/.test(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.passwordNumber'), path: ['password'] });
      }
      if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.passwordSpecial'), path: ['password'] });
      }
      if (password && confirmPassword && password !== confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.passwordsDoNotMatch'), path: ['confirm_password'] });
      }
    }
  });

type CreateUserFormValues = z.infer<ReturnType<typeof createUserSchema>>;
type EditUserFormValues = z.infer<ReturnType<typeof editUserSchema>>;

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AddUsersPage() {
  const { t } = useTranslation();
  const { data: roles = [], isLoading: rolesLoading } = useRolesQuery();
  const {
    data: profiles = [],
    isLoading: usersLoading,
    error: usersError,
  } = useUserProfilesQuery();

  const createMutation = useCreateUserProfileMutation();
  const updateMutation = useUpdateUserProfileMutation();
  const deleteMutation = useDeleteUserProfileMutation();
  const { canList, canCreate, canUpdate, canDelete } = useModulePermissions("user_management");

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [detailsUser, setDetailsUser] = useState<UserProfile | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const rolesMap = useMemo(() => new Map(roles.map((role) => [role.role_id, role.role_name])), [roles]);
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: String(role.role_id), label: role.role_name })),
    [roles],
  );

  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((profile) => {
        const matchesSearch = [profile.full_name, profile.user_name, profile.phone ?? '']
          .join(' ')
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());

        const matchesRole = roleFilter == null || profile.role_id === roleFilter;
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' ? profile.is_active === true : profile.is_active === false);

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = (a as any)[sortKey];
        const bValue = (b as any)[sortKey];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const compareValue = sortKey === 'created_at' ? new Date(aValue).getTime() - new Date(bValue).getTime() : String(aValue).localeCompare(String(bValue), undefined, { numeric: true });
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
  }, [profiles, debouncedSearch, roleFilter, statusFilter, sortKey, sortOrder]);

  const totalItems = filteredProfiles.length;
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [pageCount, page]);

  const currentPageData = useMemo(
    () => filteredProfiles.slice((page - 1) * pageSize, page * pageSize),
    [filteredProfiles, page, pageSize],
  );

  const getRoleName = (roleId: number | null) => {
    if (roleId == null) return t('addUsers.unassigned');
    return rolesMap.get(roleId) ?? t('addUsers.unassigned');
  };

  const createUserValidationSchema = useMemo(() => {
    const existingUserNames = new Set(profiles.map((profile) => profile.user_name.toLowerCase()));
    return createUserSchema(t).refine((data) => !existingUserNames.has(data.user_name.toLowerCase()), {
      message: t('addUsers.usernameTaken'),
      path: ['user_name'],
    });
  }, [profiles, t]);

  const editUserSchemaMemo = useMemo(() => {
    return editUserSchema(t).superRefine((data, ctx) => {
      const existingUserNames = profiles
        .filter((profile) => profile.id !== editingUser?.id)
        .map((profile) => profile.user_name.toLowerCase());

      if (existingUserNames.includes(data.user_name.toLowerCase())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t('addUsers.usernameTaken'), path: ['user_name'] });
      }
    });
  }, [editingUser?.id, profiles, t]);

  const initialCreateValues: CreateUserFormValues = {
    full_name: '',
    user_name: '',
    password: '',
    confirm_password: '',
    phone: '',
    role_id: undefined,
    specialty: '',
    is_active: true,
  };

  const editInitialValues: EditUserFormValues = {
    full_name: editingUser?.full_name ?? '',
    user_name: editingUser?.user_name ?? '',
    password: '',
    confirm_password: '',
    phone: editingUser?.phone ?? '',
    role_id: editingUser?.role_id ?? undefined,
    specialty: editingUser?.specialty ?? '',
    is_active: editingUser?.is_active ?? true,
  };

  const clearMessages = () => {
    setGeneralError('');
    setSuccessMessage('');
  };

  const handleCreateSubmit = async (data: CreateUserFormValues, form: any) => {
    clearMessages();

    try {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `user-${Date.now()}`;
      await createMutation.mutateAsync({
        id,
        full_name: data.full_name,
        user_name: data.user_name,
        password: data.password,
        role_id: data.role_id ?? null,
        specialty: data.specialty?.trim() ? data.specialty.trim() : null,
        phone: data.phone?.trim() ? data.phone.trim() : null,
        is_active: data.is_active,
      });
      setSuccessMessage(t('addUsers.userCreated'));
      setCreateModalOpen(false);
      form.restart();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t('addUsers.unableCreateUser'));
    }
  };

  const handleUpdateSubmit = async (data: EditUserFormValues, form: any) => {
    if (!editingUser) return;
    clearMessages();

    try {
      const payload: UpdateUserProfileParams = { id: editingUser.id };
      if (data.full_name !== editingUser.full_name) payload.full_name = data.full_name;
      if (data.user_name !== editingUser.user_name) payload.user_name = data.user_name;
      const normalizedRoleId = data.role_id ?? null;
      if (normalizedRoleId !== editingUser.role_id) payload.role_id = normalizedRoleId;
      const specialty = data.specialty?.trim() ? data.specialty.trim() : null;
      if (specialty !== editingUser.specialty) payload.specialty = specialty;
      const phone = data.phone?.trim() ? data.phone.trim() : null;
      if (phone !== editingUser.phone) payload.phone = phone;
      if (data.password?.trim()) payload.password = data.password.trim();
      if (data.is_active !== editingUser.is_active) payload.is_active = data.is_active;

      if (Object.keys(payload).length === 1) {
        setSuccessMessage(t('addUsers.noChangesDetected'));
        setEditingUser(null);
        return;
      }

      await updateMutation.mutateAsync(payload);
      setSuccessMessage(t('addUsers.userUpdated'));
      setEditingUser(null);
      form.restart();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t('addUsers.unableUpdateUser'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;
    clearMessages();

    try {
      await deleteMutation.mutateAsync({ id: deleteUserId });
      setSuccessMessage(t('addUsers.userDeleted'));
      setDeleteUserId(null);
      setDeleteConfirmOpen(false);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t('addUsers.unableDeleteUser'));
    }
  };

  const columns: Column<UserProfile>[] = [
    { key: 'full_name', header: t('profile.fullName'), sortable: true },
    { key: 'user_name', header: t('profile.username'), sortable: true },
    { key: 'phone', header: t('common.phone'), sortable: true },
    {
      key: 'role_id',
      header: t('common.role'),
      sortable: true,
      render: (_value, row) => {
        const roleName = getRoleName(row.role_id)
        const roleKey = roleName.toLowerCase().replace(/\s+/g, '_')
        const colorClass = roleBadgeColors[roleKey] || roleBadgeColors.staff || 'bg-slate-500/10 text-slate-600 border-slate-200'
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}>
            {roleName}
          </span>
        )
      },
    },
    { key: 'specialty', header: t('doctors.specialty'), sortable: true },
    {
      key: 'is_active',
      header: t('common.status.label'),
      render: (_value, row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'created_at',
      header: t('addUsers.created'),
      sortable: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
  ];

  const actions = (row: UserProfile) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setDetailsUser(row);
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title={t('common.view')}
      >
        <Eye size={15} />
      </button>
      {canUpdate && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setEditingUser(row);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          title={t('common.edit')}
        >
          <Edit2 size={15} />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setDeleteUserId(row.id);
            setDeleteConfirmOpen(true);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title={t('common.delete')}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">{t('addUsers.userManagement')}</h1>
          <p className="text-sm text-slate-500">{t('addUsers.userManagementSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus size={16} /> {t('addUsers.createUser')}
            </button>
          )}
        </div>
      </motion.header>

      {(generalError || successMessage || usersError) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              {successMessage}
            </div>
          )}
          {generalError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              {generalError}
            </div>
          )}
          {usersError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              {usersError.message || t('addUsers.unableLoadUsers')}
            </div>
          )}
        </motion.div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-5 flex items-center gap-4 border-l-4 border-indigo-500"
        >
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('addUsers.totalUsers')}
            </p>
            <p className="text-2xl font-bold">{profiles.length}</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 flex items-center gap-4 border-l-4 border-emerald-500"
        >
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('common.status.active')}
            </p>
            <p className="text-2xl font-bold">
              {profiles.filter((p) => p.is_active).length}
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5 flex items-center gap-4 border-l-4 border-red-500"
        >
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <UserX size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
              {t('common.status.inactive')}
            </p>
            <p className="text-2xl font-bold">
              {profiles.filter((p) => !p.is_active).length}
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('addUsers.searchPlaceholder')}
              className="input-field pl-10 pr-9 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={roleFilter ?? ''}
            onChange={(event) => setRoleFilter(event.target.value ? Number(event.target.value) : null)}
            className="input-field sm:w-44"
          >
            <option value="">{t('addUsers.allRoles')}</option>
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="input-field sm:w-40"
          >
            <option value="all">{t('addUsers.allStatuses')}</option>
            <option value="active">{t('common.status.active')}</option>
            <option value="inactive">{t('common.status.inactive')}</option>
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-4"
      >
        <DataTable<UserProfile>
          columns={columns}
          data={currentPageData}
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          onPageChange={(nextPage) => setPage(nextPage)}
          onSearch={(value) => setSearchQuery(value)}
          onSort={(key, order) => {
            setSortKey(key);
            setSortOrder(order);
          }}
          searchPlaceholder={t('addUsers.searchUsers')}
          isLoading={usersLoading}
          emptyMessage={t('addUsers.noUsersFound')}
          actions={actions}
        />
      </motion.div>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title={t('addUsers.createUser')} size="lg">
        <AppForm<CreateUserFormValues>
          initialValues={initialCreateValues}
          validate={zodValidator(createUserValidationSchema)}
          onSubmit={handleCreateSubmit}
          className="space-y-5"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField name="full_name" label={t('profile.fullName')} placeholder={t('addUsers.enterFullName')} required />
            <FormField name="user_name" label={t('profile.username')} placeholder={t('auth.username')} required />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField name="password" type="password" label={t('auth.password')} placeholder={t('auth.enterPassword')} required />
            <FormField name="confirm_password" type="password" label={t('addUsers.confirmPassword')} placeholder={t('addUsers.confirmPassword')} required />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField name="phone" label={t('common.phone')} placeholder={t('addUsers.phoneNumber')} />
            <FormField name="role_id" type="select" label={t('common.role')} options={roleOptions} disabled={rolesLoading} placeholder={t('addUsers.selectRole')} />
          </div>
          <FormField name="specialty" label={t('doctors.specialty')} placeholder={t('addUsers.specialtyDepartment')} />
          <Field name="is_active" type="checkbox">
            {({ input }) => (
              <div className="flex items-center gap-2">
                <input {...input} id="create_is_active" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                <label htmlFor="create_is_active" className="text-sm text-slate-700">{t('addUsers.activeAccount')}</label>
              </div>
            )}
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 rounded-lg border text-slate-700">{t('common.cancel')}</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70">
              {createMutation.isPending ? t('addUsers.creating') : t('addUsers.createUser')}
            </button>
          </div>
        </AppForm>
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={t('addUsers.editUser')} size="lg">
        {editingUser && (
          <AppForm<EditUserFormValues>
            key={editingUser.id}
            initialValues={editInitialValues}
            validate={zodValidator(editUserSchemaMemo)}
            onSubmit={handleUpdateSubmit}
            className="space-y-5"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField name="full_name" label={t('profile.fullName')} placeholder={t('addUsers.enterFullName')} required />
              <FormField name="user_name" label={t('profile.username')} placeholder={t('auth.username')} required />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField name="phone" label={t('common.phone')} placeholder={t('addUsers.phoneNumber')} />
              <FormField name="role_id" type="select" label={t('common.role')} options={roleOptions} disabled={rolesLoading} placeholder={t('addUsers.selectRole')} />
            </div>
            <FormField name="specialty" label={t('doctors.specialty')} placeholder={t('addUsers.specialtyDepartment')} />
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField name="password" type="password" label={t('addUsers.newPassword')} placeholder={t('addUsers.keepCurrentPassword')} />
              <FormField name="confirm_password" type="password" label={t('addUsers.confirmNewPassword')} placeholder={t('addUsers.confirmNewPassword')} />
            </div>
            <Field name="is_active" type="checkbox">
              {({ input }) => (
                <div className="flex items-center gap-2">
                  <input {...input} id="edit_is_active" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  <label htmlFor="edit_is_active" className="text-sm text-slate-700">{t('addUsers.activeAccount')}</label>
                </div>
              )}
            </Field>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg border text-slate-700">{t('common.cancel')}</button>
              <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70">
                {updateMutation.isPending ? t('common.saving') : t('profile.saveChanges')}
              </button>
            </div>
          </AppForm>
        )}
      </Modal>

      <Modal
        isOpen={!!detailsUser}
        onClose={() => setDetailsUser(null)}
        title={t('addUsers.userDetails')}
        size="md"
      >
        {detailsUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {detailsUser.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {detailsUser.full_name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  @{detailsUser.user_name}
                </p>
              </div>
              <div className="ml-auto">
                <StatusBadge status={detailsUser.is_active ? 'active' : 'inactive'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t('common.role')}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {getRoleName(detailsUser.role_id)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t('common.phone')}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {detailsUser.phone || t('common.notAvailable')}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t('doctors.specialty')}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {detailsUser.specialty || t('common.notAvailable')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t('addUsers.created')}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {new Date(detailsUser.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                  {t('addUsers.updated')}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {new Date(detailsUser.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('addUsers.deleteUser')}
        message={t('addUsers.deleteUserConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
