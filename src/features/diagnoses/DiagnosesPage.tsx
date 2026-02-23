import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { diagnosisService } from '../../services/diagnosis.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { Diagnosis } from '../../types';

const diagSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  cancer_type_id: z.string().min(1, 'Cancer type is required'),
  doctor_id: z.string().min(1, 'Doctor is required'),
  diagnosis_date: z.string().min(1, 'Date is required'),
  notes: z.string().min(1, 'Notes are required'),
  status: z.enum(['confirmed', 'suspected', 'resolved']),
});

type DiagForm = z.infer<typeof diagSchema>;

export default function DiagnosesPage() {
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['diagnoses', page],
    queryFn: () => diagnosisService.getAll({ page, pageSize: 10 }),
  });

  const createMut = useMutation({
    mutationFn: (d: DiagForm) => diagnosisService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnoses'] }); toast.success('Diagnosis created'); setShowForm(false); },
  });

  const methods = useForm<DiagForm>({ resolver: zodResolver(diagSchema), defaultValues: { status: 'confirmed' } });

  const patients = store.patients.filter((p) => !p.is_deleted);
  const doctors = store.doctors;
  const cancerTypes = store.cancer_types;

  const columns: Column<Diagnosis>[] = [
    { key: 'patient_id', header: 'Patient', render: (v) => {
      const p = patients.find((pt) => pt.id === String(v));
      return <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p ? `${p.first_name} ${p.last_name}` : 'Unknown'}</span>;
    }},
    { key: 'cancer_type_id', header: 'Cancer Type', render: (v) => {
      const ct = cancerTypes.find((c) => c.id === String(v));
      return ct ? <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ct.color }} />{ct.name}</div> : 'Unknown';
    }},
    { key: 'doctor_id', header: 'Doctor', render: (v) => {
      const doc = doctors.find((d) => d.id === String(v));
      const u = doc ? store.users.find((us) => us.id === doc.user_id) : null;
      return u?.full_name || 'Unknown';
    }},
    { key: 'diagnosis_date', header: 'Date', sortable: true, render: (v) => formatDate(String(v)) },
    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Diagnoses</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage patient diagnoses</p>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as unknown as Record<string, unknown>[]}
        totalItems={data?.total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        isLoading={isLoading}
        headerActions={
          <button onClick={() => { methods.reset(); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> Add Diagnosis
          </button>
        }
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Diagnosis" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="patient_id" label="Patient" type="select" required options={patients.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
              <FormField name="cancer_type_id" label="Cancer Type" type="select" required options={cancerTypes.map((ct) => ({ value: ct.id, label: ct.name }))} />
              <FormField name="doctor_id" label="Doctor" type="select" required options={doctors.map((d) => ({ value: d.id, label: store.users.find((u) => u.id === d.user_id)?.full_name || d.id }))} />
              <FormField name="diagnosis_date" label="Date" type="date" required />
              <FormField name="status" label="Status" type="select" options={[{ value: 'confirmed', label: 'Confirmed' }, { value: 'suspected', label: 'Suspected' }, { value: 'resolved', label: 'Resolved' }]} />
            </div>
            <FormField name="notes" label="Notes" type="textarea" required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Create Diagnosis</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
