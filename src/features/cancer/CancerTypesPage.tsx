import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { diagnosisService } from '../../services/diagnosis.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import type { CancerType } from '../../types';

const ctSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  color: z.string().min(1, 'Color is required'),
  description: z.string().min(1, 'Description is required'),
});

type CTForm = z.infer<typeof ctSchema>;

export default function CancerTypesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CancerType | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cancer-types'],
    queryFn: () => diagnosisService.getCancerTypes(),
  });

  const createMut = useMutation({
    mutationFn: (d: CTForm) => diagnosisService.addCancerType(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success('Created'); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: CTForm) => diagnosisService.updateCancerType(editItem!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success('Updated'); setShowForm(false); setEditItem(null); },
  });

  const methods = useForm<CTForm>({ resolver: zodResolver(ctSchema) });

  const openAdd = () => { setEditItem(null); methods.reset({ name: '', code: '', color: '#6366f1', description: '' }); setShowForm(true); };
  const openEdit = (ct: CancerType) => { setEditItem(ct); methods.reset({ name: ct.name, code: ct.code, color: ct.color, description: ct.description }); setShowForm(true); };
  const onSubmit = (d: CTForm) => editItem ? updateMut.mutate(d) : createMut.mutate(d);

  const columns: Column<CancerType>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (_, row) => (
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: row.color }} />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.name}</span>
      </div>
    )},
    { key: 'code', header: 'Code', render: (v) => <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-primary)' }}>{String(v)}</span> },
    { key: 'description', header: 'Description' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Cancer Types</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage cancer type classifications</p>
      </div>

      <DataTable
        columns={columns}
        data={(data || []) as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        headerActions={
          <button onClick={openAdd} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> Add Type
          </button>
        }
        actions={(row) => (
          <button onClick={() => openEdit(row as unknown as CancerType)} className="p-1.5 rounded-lg hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? 'Edit Cancer Type' : 'Add Cancer Type'} size="sm">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="name" label="Name" required />
            <FormField name="code" label="Code" required placeholder="e.g. BC" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Color</label>
              <input type="color" {...methods.register('color')} className="w-full h-10 rounded-lg cursor-pointer border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
            <FormField name="description" label="Description" type="textarea" required />
            <div className="flex justify-end pt-4">
              <button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{editItem ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
