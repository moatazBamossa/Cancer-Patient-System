import React, { useEffect, useMemo, useState } from 'react';
import { Field } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { Plus, Eye, Edit2, Trash2, Search, X } from 'lucide-react';
import { AppForm } from '../../components/ui/AppForm';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { z } from 'zod';
import { zodValidator } from '../../lib/zodValidator';
import { useRolesQuery } from '../../modules/roles/hooks/role.hooks';
import {
  useCreateUserProfileMutation,
  useDeleteUserProfileMutation,
  useUpdateUserProfileMutation,
  useUserProfilesQuery,
} from '../../hooks/useUserProfiles';
import type { UserProfile } from '../../utils/user-profile-normalizers';
import type { CreateUserProfileParams, UpdateUserProfileParams } from '../../types/user-profile';

const phoneSchema = z
  .union([
    z
      .string()
      .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number')
      .refine((value) => !value || value.replace(/\D/g, '').length >= 9, 'Invalid phone number'),
    z.literal(''),
    z.undefined(),
  ])
  .optional();

const createUserSchema = z
  .object({
    full_name: z.string().min(3, 'Full name must be at least 3 characters').max(100),
    user_name: z.string().min(4, 'Username must be at least 4 characters').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[0-9]/, 'Password must contain a number')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain a special character'),
    confirm_password: z.string(),
    phone: phoneSchema,
    role_id: z.number().nullable().optional(),
    specialty: z.string().optional(),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

const editUserSchema = z
  .object({
    full_name: z.string().min(3, 'Full name must be at least 3 characters').max(100),
    user_name: z.string().min(4, 'Username must be at least 4 characters').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers and underscores'),
    password: z.string().optional(),
    confirm_password: z.string().optional(),
    phone: phoneSchema,
    role_id: z.number().nullable().optional(),
    specialty: z.string().optional(),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const password = data.password?.trim();
    const confirmPassword = data.confirm_password?.trim();

    if (password || confirmPassword) {
      if (!password) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password is required', path: ['password'] });
      }
      if (!confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please confirm the password', path: ['confirm_password'] });
      }
      if (password && password.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must be at least 8 characters', path: ['password'] });
      }
      if (password && !/[A-Z]/.test(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must contain an uppercase letter', path: ['password'] });
      }
      if (password && !/[0-9]/.test(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must contain a number', path: ['password'] });
      }
      if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must contain a special character', path: ['password'] });
      }
      if (password && confirmPassword && password !== confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirm_password'] });
      }
    }
  });

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

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
    if (roleId == null) return 'Unassigned';
    return rolesMap.get(roleId) ?? 'Unassigned';
  };

  const createUserValidationSchema = useMemo(() => {
    const existingUserNames = new Set(profiles.map((profile) => profile.user_name.toLowerCase()));
    return createUserSchema.refine((data) => !existingUserNames.has(data.user_name.toLowerCase()), {
      message: 'Username is already taken',
      path: ['user_name'],
    });
  }, [profiles]);

  const editUserSchemaMemo = useMemo(() => {
    return editUserSchema.superRefine((data, ctx) => {
      const existingUserNames = profiles
        .filter((profile) => profile.id !== editingUser?.id)
        .map((profile) => profile.user_name.toLowerCase());

      if (existingUserNames.includes(data.user_name.toLowerCase())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username is already taken', path: ['user_name'] });
      }
    });
  }, [editingUser?.id, profiles]);

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
      setSuccessMessage('User created successfully');
      setCreateModalOpen(false);
      form.restart();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Unable to create user');
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
        setSuccessMessage('No changes detected');
        setEditingUser(null);
        return;
      }

      await updateMutation.mutateAsync(payload);
      setSuccessMessage('User updated successfully');
      setEditingUser(null);
      form.restart();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Unable to update user');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;
    clearMessages();

    try {
      await deleteMutation.mutateAsync({ id: deleteUserId });
      setSuccessMessage('User deleted successfully');
      setDeleteUserId(null);
      setDeleteConfirmOpen(false);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Unable to delete user');
    }
  };

  const columns: Column<UserProfile>[] = [
    { key: 'full_name', header: 'Full Name', sortable: true },
    { key: 'user_name', header: 'Username', sortable: true },
    { key: 'phone', header: 'Phone', sortable: true },
    {
      key: 'role_id',
      header: 'Role',
      sortable: true,
      render: (_value, row) => getRoleName(row.role_id),
    },
    { key: 'specialty', header: 'Specialty', sortable: true },
    {
      key: 'is_active',
      header: 'Status',
      render: (_value, row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
  ];

  const actions = (row: UserProfile) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setDetailsUser(row);
        }}
        className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
      >
        <Eye size={14} /> View
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setEditingUser(row);
        }}
        className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
      >
        <Edit2 size={14} /> Edit
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setDeleteUserId(row.id);
          setDeleteConfirmOpen(true);
        }}
        className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-slate-500">Create, update, and manage application users with role and status controls.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus size={16} /> Create User
          </button>
        </div>
      </header>

      {(generalError || successMessage || usersError) && (
        <div className="space-y-3">
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
              {usersError.message || 'Unable to load users.'}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="rounded-xl border p-4 bg-white shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Search</label>
                <div className="relative mt-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search full name, username or phone"
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={roleFilter ?? ''}
                  onChange={(event) => setRoleFilter(event.target.value ? Number(event.target.value) : null)}
                  className="input-field w-full mt-1"
                >
                  <option value="">All roles</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="input-field w-full mt-1"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
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
              searchPlaceholder="Search users..."
              isLoading={usersLoading}
              emptyMessage="No users found. Adjust filters or create a user."
              actions={actions}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold">Total users:</span> {profiles.length}
              </p>
              <p>
                <span className="font-semibold">Visible results:</span> {totalItems}
              </p>
              <p>
                <span className="font-semibold">Selected role:</span> {roleFilter ? getRoleName(roleFilter) : 'All roles'}
              </p>
              <p>
                <span className="font-semibold">Status filter:</span> {statusFilter === 'all' ? 'All' : statusFilter === 'active' ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Tips</h2>
            <p className="mt-3 text-sm text-slate-600">Use the filters and search input to narrow down users. View user details for audit fields and edit access controls.</p>
          </div>
        </aside>
      </div>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create User" size="lg">
        <AppForm<CreateUserFormValues>
          initialValues={initialCreateValues}
          validate={zodValidator(createUserValidationSchema)}
          onSubmit={handleCreateSubmit}
          className="space-y-5"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField name="full_name" label="Full Name" placeholder="Enter full name" required />
            <FormField name="user_name" label="Username" placeholder="username" required />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField name="password" type="password" label="Password" placeholder="Enter password" required />
            <FormField name="confirm_password" type="password" label="Confirm Password" placeholder="Confirm password" required />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FormField name="phone" label="Phone" placeholder="Phone number" />
            <FormField name="role_id" type="select" label="Role" options={roleOptions} disabled={rolesLoading} placeholder="Select a role" />
          </div>
          <FormField name="specialty" label="Specialty" placeholder="Specialty or department" />
          <Field name="is_active" type="checkbox">
            {({ input }) => (
              <div className="flex items-center gap-2">
                <input {...input} id="create_is_active" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                <label htmlFor="create_is_active" className="text-sm text-slate-700">Active account</label>
              </div>
            )}
          </Field>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 rounded-lg border text-slate-700">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </AppForm>
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User" size="lg">
        {editingUser && (
          <AppForm<EditUserFormValues>
            key={editingUser.id}
            initialValues={editInitialValues}
            validate={zodValidator(editUserSchemaMemo)}
            onSubmit={handleUpdateSubmit}
            className="space-y-5"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField name="full_name" label="Full Name" placeholder="Enter full name" required />
              <FormField name="user_name" label="Username" placeholder="username" required />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField name="phone" label="Phone" placeholder="Phone number" />
              <FormField name="role_id" type="select" label="Role" options={roleOptions} disabled={rolesLoading} placeholder="Select a role" />
            </div>
            <FormField name="specialty" label="Specialty" placeholder="Specialty or department" />
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField name="password" type="password" label="New Password" placeholder="Leave blank to keep current password" />
              <FormField name="confirm_password" type="password" label="Confirm New Password" placeholder="Confirm new password" />
            </div>
            <Field name="is_active" type="checkbox">
              {({ input }) => (
                <div className="flex items-center gap-2">
                  <input {...input} id="edit_is_active" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                  <label htmlFor="edit_is_active" className="text-sm text-slate-700">Active account</label>
                </div>
              )}
            </Field>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-lg border text-slate-700">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70">
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </AppForm>
        )}
      </Modal>

      {detailsUser && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40" onClick={() => setDetailsUser(null)}>
          <div className="relative w-full max-w-md bg-white p-6 overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setDetailsUser(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-700">
              <X size={20} />
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">User Details</h2>
                <p className="text-sm text-slate-500">Read-only profile details for the selected user.</p>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Full name</p>
                  <p className="text-base font-medium">{detailsUser.full_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Username</p>
                  <p className="text-base font-medium">{detailsUser.user_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Role</p>
                  <p className="text-base font-medium">{getRoleName(detailsUser.role_id)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Phone</p>
                  <p className="text-base font-medium">{detailsUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Specialty</p>
                  <p className="text-base font-medium">{detailsUser.specialty || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
                  <StatusBadge status={detailsUser.is_active ? 'active' : 'inactive'} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Created</p>
                  <p className="text-base font-medium">{new Date(detailsUser.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">Updated</p>
                  <p className="text-base font-medium">{new Date(detailsUser.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete user"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
