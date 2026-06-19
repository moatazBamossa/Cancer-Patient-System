import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search} from 'lucide-react';
import { Field } from 'react-final-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { diagnosisService } from '../../services/diagnosis.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { zodValidator } from '../../lib/zodValidator';
import type { CancerType } from '../../types';

export default function CancerTypesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CancerType | null>(null);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete state
  const [deleteItem, setDeleteItem] = useState<CancerType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const ctSchema = z.object({
    cancer_name: z.string().min(1, t('cancer.nameRequired', { defaultValue: 'Name is required' })),
    color: z.string().min(1, t('cancer.colorRequired', { defaultValue: 'Color is required' })),
    icd10_code: z.string().optional().default(''),
    description: z.string().optional().default(''),
  });

  type CTForm = z.infer<typeof ctSchema>;

  const { data, isLoading } = useQuery({
    queryKey: ['cancer-types', searchQuery],
    queryFn: () =>
      searchQuery
        ? diagnosisService.searchCancerTypes(searchQuery)
        : diagnosisService.getCancerTypes(),
  });

  const createMut = useMutation({
    mutationFn: (d: CTForm) => diagnosisService.addCancerType(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success(t('common.created')); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: (d: CTForm) => diagnosisService.updateCancerType(editItem!.cancer_id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success(t('common.updated')); setShowForm(false); setEditItem(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => diagnosisService.deleteCancerType(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cancer-types'] }); toast.success(t('common.deleted')); setShowDeleteConfirm(false); setDeleteItem(null); },
  });

  const defaultValues: CTForm = { cancer_name: '', color: '#6366f1', icd10_code: '', description: '' };
  const [formInitialValues, setFormInitialValues] = useState<CTForm>(defaultValues);
  const [formKey, setFormKey] = useState(0);

  const openAdd = () => {
    setEditItem(null);
    setFormInitialValues(defaultValues);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const openEdit = (ct: CancerType) => {
    setEditItem(ct);
    setFormInitialValues({ cancer_name: ct.cancer_name, color: ct.color, icd10_code: ct.icd10_code, description: ct.description });
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const confirmDelete = (ct: CancerType) => {
    setDeleteItem(ct);
    setShowDeleteConfirm(true);
  };

  const onSubmit = (d: CTForm) => editItem ? updateMut.mutate(d) : createMut.mutate(d);



  const columns: Column<CancerType>[] = [
    { key: 'cancer_name', header: t('common.name'), sortable: true, render: (_, row) => (
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: row.color }} />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{row.cancer_name}</span>
      </div>
    )},
    { key: 'icd10_code', header: t('cancer.icd10', { defaultValue: 'ICD-10' }) },
    { key: 'description', header: t('common.description', { defaultValue: 'Description' }) },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('cancer.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('cancer.subtitle')}</p>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('common.search', { defaultValue: 'Search...' })}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <DataTable<CancerType>
        columns={columns}
        data={data || []}
        isLoading={isLoading}
        headerActions={
          <button onClick={openAdd} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5 rounded-lg">
            <Plus size={16} /> {t('cancer.addType')}
          </button>
        }
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}>
              <Edit2 size={16} />
            </button>
            <button onClick={() => confirmDelete(row)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? t('cancer.editType') : t('cancer.addTypeTitle')} size="sm">
        <AppForm<CTForm>
          formKey={formKey}
          initialValues={formInitialValues}
          validate={zodValidator(ctSchema)}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <FormField name="cancer_name" label={t('common.name')} required />
          <FormField name="icd10_code" label={t('cancer.icd10', { defaultValue: 'ICD-10 Code' })} />
          <FormField name="description" label={t('common.description', { defaultValue: 'Description' })} type="textarea" />

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('common.color')}</label>
            <Field name="color">
              {({ input }) => (
                <input type="color" {...input} className="w-full h-10 rounded-lg cursor-pointer border p-1 bg-transparent" style={{ borderColor: 'var(--border-color)' }} />
              )}
            </Field>
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="gradient-btn px-6 py-2 text-sm rounded-lg disabled:opacity-50">
              {editItem ? t('common.update') : t('common.create')}
            </button>
          </div>
        </AppForm>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (deleteItem) deleteMut.mutate(deleteItem.cancer_id);
        }}
        title={t('common.delete', { defaultValue: 'Delete' })}
        message={t('cancer.deleteConfirm', { defaultValue: 'Are you sure you want to delete this cancer type?' })}
        variant="danger"
      />
    </motion.div>
  );
}
