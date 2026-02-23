import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { roleService } from '../../services/general.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FormField } from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';
import type { Role } from '../../types';

const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
});

type RoleForm = z.infer<typeof roleSchema>;

export default function RolesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: (d: RoleForm) => roleService.create({ ...d, permissions: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role created'); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: (d: RoleForm) => roleService.update(editRole!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role updated'); setShowForm(false); setEditRole(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => roleService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role deleted'); },
  });

  const methods = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '' },
  });

  const openEdit = (role: Role) => {
    setEditRole(role);
    methods.reset({ name: role.name, description: role.description });
    setShowForm(true);
  };

  const openAdd = () => {
    setEditRole(null);
    methods.reset({ name: '', description: '' });
    setShowForm(true);
  };

  const onSubmit = (d: RoleForm) => editRole ? updateMut.mutate(d) : createMut.mutate(d);

  const columns: Column<Role>[] = [
    { key: 'name', header: 'Role Name', sortable: true, render: (v) => <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{String(v)}</span> },
    { key: 'description', header: 'Description' },
    { key: 'created_at', header: 'Created', render: (v) => formatDate(String(v)) },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Roles</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage user roles and permissions</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={(roles || []) as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        headerActions={
          <button onClick={openAdd} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> Add Role
          </button>
        }
        actions={(row) => {
          const role = row as unknown as Role;
          return (
            <div className="flex gap-1">
              <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
              <button onClick={() => setDeleteTarget(role)} className="p-1.5 rounded-lg hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}><Trash2 size={16} /></button>
            </div>
          );
        }}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditRole(null); }} title={editRole ? 'Edit Role' : 'Add Role'} size="sm">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="name" label="Role Name" required />
            <FormField name="description" label="Description" type="textarea" required />
            <div className="flex justify-end pt-4">
              <button type="submit" className="gradient-btn px-6 py-2.5 text-sm">
                {editRole ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete Role"
        message={`Delete role "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </motion.div>
  );
}
