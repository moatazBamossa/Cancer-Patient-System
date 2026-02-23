import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { treatmentService } from '../../services/treatment.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { Medication } from '../../types';

const medSchema = z.object({
  name: z.string().min(1),
  generic_name: z.string().min(1),
  category: z.enum(['chemo', 'hormonal', 'supportive']),
  dosage_form: z.string().min(1),
  standard_dose: z.string().min(1),
  side_effects: z.string().min(1),
});

type MedForm = z.infer<typeof medSchema>;

export default function MedicationsPage() {
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
    mutationFn: (d: MedForm) => treatmentService.addMedication(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medications'] }); toast.success('Created'); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: (d: MedForm) => treatmentService.updateMedication(editItem!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['medications'] }); toast.success('Updated'); setShowForm(false); setEditItem(null); },
  });

  const methods = useForm<MedForm>({ resolver: zodResolver(medSchema), defaultValues: { category: 'chemo' } });
  const openAdd = () => { setEditItem(null); methods.reset({ name: '', generic_name: '', category: 'chemo', dosage_form: '', standard_dose: '', side_effects: '' }); setShowForm(true); };
  const openEdit = (m: Medication) => { setEditItem(m); methods.reset({ name: m.name, generic_name: m.generic_name, category: m.category, dosage_form: m.dosage_form, standard_dose: m.standard_dose, side_effects: m.side_effects }); setShowForm(true); };

  const columns: Column<Medication>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (v) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{String(v)}</span> },
    { key: 'generic_name', header: 'Generic Name' },
    { key: 'category', header: 'Category', render: (v) => <StatusBadge status={String(v)} /> },
    { key: 'dosage_form', header: 'Form' },
    { key: 'standard_dose', header: 'Standard Dose' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Medications</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage medication catalog</p>
      </div>

      <DataTable
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        headerActions={
          <div className="flex gap-2">
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="input-field w-36 text-sm">
              <option value="">All Categories</option>
              <option value="chemo">Chemotherapy</option>
              <option value="hormonal">Hormonal</option>
              <option value="supportive">Supportive</option>
            </select>
            <button onClick={openAdd} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"><Plus size={16} /> Add Medication</button>
          </div>
        }
        actions={(row) => (
          <button onClick={() => openEdit(row as unknown as Medication)} className="p-1.5 rounded-lg hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}><Edit2 size={16} /></button>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} title={editItem ? 'Edit Medication' : 'Add Medication'} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => editItem ? updateMut.mutate(d) : createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="name" label="Name" required />
              <FormField name="generic_name" label="Generic Name" required />
              <FormField name="category" label="Category" type="select" required options={[{ value: 'chemo', label: 'Chemotherapy' }, { value: 'hormonal', label: 'Hormonal' }, { value: 'supportive', label: 'Supportive' }]} />
              <FormField name="dosage_form" label="Dosage Form" required placeholder="e.g. IV Infusion" />
              <FormField name="standard_dose" label="Standard Dose" required placeholder="e.g. 75 mg/m²" />
            </div>
            <FormField name="side_effects" label="Side Effects" type="textarea" required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{editItem ? 'Update' : 'Create'}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
