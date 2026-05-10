import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2, ShieldAlert } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getDataStore, simulateApiCall } from '../../services/mockApi';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Role } from '../../types';

export default function RolesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Role | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const roleSchema = z.object({
    role_name: z.string().min(1, t('roles.nameRequired')),
  });

  type RoleForm = z.infer<typeof roleSchema>;

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => simulateApiCall(() => getDataStore().roles),
  });

  const createMut = useMutation({
    mutationFn: (d: RoleForm) => simulateApiCall(() => {
        const store = getDataStore();
        const newRole: Role = { role_id: `role_${Date.now()}`, role_name: d.role_name };
        store.roles.push(newRole);
        return newRole;
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success(t('roles.roleCreated')); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: RoleForm & { role_id: string }) => simulateApiCall(() => {
        const store = getDataStore();
        const role = store.roles.find(r => r.role_id === d.role_id);
        if (role) role.role_name = d.role_name;
        return role;
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success(t('roles.roleUpdated')); setShowForm(false); setEditItem(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => simulateApiCall(() => {
        const store = getDataStore();
        store.roles = store.roles.filter(r => r.role_id !== id);
        return true;
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success(t('roles.roleDeleted')); setDeleteId(null); },
  });

  const methods = useForm<RoleForm>({ resolver: zodResolver(roleSchema) });

  const columns: Column<Role>[] = [
    { key: 'role_name', header: t('roles.roleName'), sortable: true, render: (v) => <span className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><ShieldAlert size={14} className="text-indigo-500" />{String(v)}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('roles.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('roles.subtitle')}</p>
      </div>

      <DataTable
        columns={columns}
        data={roles || []}
        isLoading={isLoading}
        headerActions={
          <button onClick={() => { setEditItem(null); methods.reset({ role_name: '' }); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> {t('roles.addRole')}
          </button>
        }
        actions={(row) => (
          <div className="flex gap-1">
            <button
              onClick={() => { setEditItem(row); methods.reset({ role_name: row.role_name }); setShowForm(true); }}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? t('roles.editRole') : t('roles.addRoleTitle')} size="sm">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => editItem ? updateMut.mutate({ ...d, role_id: editItem.role_id }) : createMut.mutate(d))} className="space-y-4">
            <FormField name="role_name" label={t('roles.roleName')} required placeholder="e.g. administrator" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{editItem ? t('common.update') : t('common.create')}</button></div>
          </form>
        </FormProvider>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title={t('roles.deleteTitle')}
        message={t('roles.deleteConfirm', { name: roles?.find(r => r.role_id === deleteId)?.role_name })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </motion.div>
  );
}
