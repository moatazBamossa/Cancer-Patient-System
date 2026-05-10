import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { diagnosisService } from '../../services/diagnosis.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import type { CancerType } from '../../types';

export default function CancerTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CancerType | null>(null);

  const ctSchema = z.object({
    cancer_name: z.string().min(1, t('cancer.nameRequired')),
    color: z.string().min(1, t('cancer.colorRequired')),
    icd10_code: z.string().optional().default(''),
    description: z.string().optional().default(''),
  });

  type CTForm = z.infer<typeof ctSchema>;

  const { data, isLoading } = useQuery({
    queryKey: ['cancer-types'],
    queryFn: () => diagnosisService.getCancerTypes(),
  });

  const createMut = useMutation({
    mutationFn: (d: CTForm) => diagnosisService.addCancerType(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success(t('common.created')); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: CTForm) => diagnosisService.updateCancerType(editItem!.cancer_id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success(t('common.updated')); setShowForm(false); setEditItem(null); },
  });

  const methods = useForm<CTForm>({ resolver: zodResolver(ctSchema) });

  const openAdd = () => { setEditItem(null); methods.reset({ cancer_name: '', color: '#6366f1', icd10_code: '', description: '' }); setShowForm(true); };
  const openEdit = (ct: CancerType) => { setEditItem(ct); methods.reset({ cancer_name: ct.cancer_name, color: ct.color, icd10_code: ct.icd10_code, description: ct.description }); setShowForm(true); };
  const onSubmit = (d: CTForm) => editItem ? updateMut.mutate(d) : createMut.mutate(d);

  const columns: Column<CancerType>[] = [
    { key: 'cancer_name', header: t('common.name'), sortable: true, render: (_, row) => (
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: row.color }} />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.cancer_name}</span>
      </div>
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('cancer.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('cancer.subtitle')}</p>
      </div>

      <DataTable<CancerType>
        columns={columns}
        data={data || []}
        isLoading={isLoading}
        headerActions={
          <button onClick={openAdd} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> {t('cancer.addType')}
          </button>
        }
        actions={(row) => (
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? t('cancer.editType') : t('cancer.addTypeTitle')} size="sm">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="cancer_name" label={t('common.name')} required />
            <div className="space-y-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('common.color')}</label>
              <input type="color" {...methods.register('color')} className="w-full h-10 rounded-lg cursor-pointer border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{editItem ? t('common.update') : t('common.create')}</button>
            </div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
