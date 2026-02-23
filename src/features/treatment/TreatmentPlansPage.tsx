import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { treatmentService } from '../../services/treatment.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { TreatmentPlan } from '../../types';

const planSchema = z.object({
  patient_id: z.string().min(1),
  diagnosis_id: z.string().min(1),
  doctor_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['ongoing', 'completed', 'stopped', 'planned']),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
});

type PlanForm = z.infer<typeof planSchema>;

export default function TreatmentPlansPage() {
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['treatment-plans', page],
    queryFn: () => treatmentService.getPlans({ page, pageSize: 10 }),
  });

  const createMut = useMutation({
    mutationFn: (d: PlanForm) => treatmentService.createPlan({ ...d, end_date: d.end_date || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatment-plans'] }); toast.success('Plan created'); setShowForm(false); },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => treatmentService.updatePlan(id, { status: status as TreatmentPlan['status'] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatment-plans'] }); toast.success('Status updated'); },
  });

  const methods = useForm<PlanForm>({ resolver: zodResolver(planSchema), defaultValues: { status: 'planned' } });

  const patients = store.patients.filter((p) => !p.is_deleted);
  const diagnoses = store.diagnoses;
  const doctors = store.doctors;

  const columns: Column<TreatmentPlan>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (v) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{String(v)}</span> },
    { key: 'patient_id', header: 'Patient', render: (v) => { const p = patients.find((pt) => pt.id === String(v)); return p ? `${p.first_name} ${p.last_name}` : 'Unknown'; }},
    { key: 'start_date', header: 'Start', render: (v) => formatDate(String(v)) },
    { key: 'status', header: 'Status', render: (v, row) => (
      <select
        value={String(v)}
        onChange={(e) => statusMut.mutate({ id: row.id, status: e.target.value })}
        className="text-xs px-2 py-1 rounded-lg border-0 font-semibold cursor-pointer"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="planned">Planned</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
        <option value="stopped">Stopped</option>
      </select>
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Treatment Plans</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage patient treatment plans</p>
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
            <Plus size={16} /> Add Plan
          </button>
        }
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Treatment Plan" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <FormField name="title" label="Title" required />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="patient_id" label="Patient" type="select" required options={patients.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
              <FormField name="diagnosis_id" label="Diagnosis" type="select" required options={diagnoses.map((d) => ({ value: d.id, label: `${d.id} - ${formatDate(d.diagnosis_date)}` }))} />
              <FormField name="doctor_id" label="Doctor" type="select" required options={doctors.map((d) => ({ value: d.id, label: store.users.find((u) => u.id === d.user_id)?.full_name || d.id }))} />
              <FormField name="start_date" label="Start Date" type="date" required />
              <FormField name="status" label="Status" type="select" options={[{ value: 'planned', label: 'Planned' }, { value: 'ongoing', label: 'Ongoing' }]} />
            </div>
            <FormField name="description" label="Description" type="textarea" required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Create Plan</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
