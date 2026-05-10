import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { treatmentService } from '../../services/treatment.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Medication } from '../../types';

const medSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['chemo', 'hormonal', 'supportive']),
  unit: z.string().min(1),
  description: z.string().optional().default(''),
});

type MedForm = z.infer<typeof medSchema>;

export default function MedicationsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Medication | null>(null);
  const [catFilter, setCatFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: () => treatmentService.getMedications(),
  });

  const filtered = data?.filter((m) => !catFilter || m.category === catFilter) || [];

  const createMut = useMutation({
    mutationFn: (d: MedForm) => treatmentService.addMedication({ ...d, is_active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medications'] }); toast.success(t('common.created')); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: MedForm) => treatmentService.updateMedication(editItem!.medication_id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medications'] }); toast.success(t('common.updated')); setShowForm(false); setEditItem(null); },
  });

  const methods = useForm<MedForm>({ resolver: zodResolver(medSchema), defaultValues: { category: 'chemo' } });
  const openAdd = () => { setEditItem(null); methods.reset({ name: '', category: 'chemo', unit: '', description: '' }); setShowForm(true); };
  const openEdit = (m: Medication) => { setEditItem(m); methods.reset({ name: m.name, category: m.category, unit: m.unit, description: m.description }); setShowForm(true); };

  const columns: Column<Medication>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (v) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{String(v)}</span> },
    { key: 'category', header: t('medications.category'), render: (v) => <StatusBadge status={String(v)} /> },
    { key: 'unit', header: t('lab.unit') },
    { key: 'description', header: t('common.description'), render: (v) => <span className="text-xs truncate max-w-[200px] inline-block">{String(v)}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('medications.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('medications.subtitle')}</p>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input-field w-36 text-sm">
              <option value="">{t('medications.allCategories')}</option>
              <option value="chemo">{t('medications.chemotherapy')}</option>
              <option value="hormonal">{t('medications.hormonal')}</option>
              <option value="supportive">{t('medications.supportive')}</option>
            </select>
            <button onClick={openAdd} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"><Plus size={16} /> {t('medications.addMedication')}</button>
          </div>
        }
        actions={(row) => (
          <button onClick={() => openEdit(row as unknown as Medication)} className="p-1.5 rounded-lg hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? t('medications.editMedication') : t('medications.addMedicationTitle')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => editItem ? updateMut.mutate(d) : createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label={t('common.name')} required />
              <FormField name="category" label={t('medications.category')} type="select" required options={[{ value: 'chemo', label: t('medications.chemotherapy') }, { value: 'hormonal', label: t('medications.hormonal') }, { value: 'supportive', label: t('medications.supportive') }]} />
              <FormField name="unit" label={t('lab.unit')} required placeholder="e.g., mg, mcg" />
            </div>
            <FormField name="description" label={t('common.description')} type="textarea" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{editItem ? t('common.update') : t('common.create')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
