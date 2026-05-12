import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { treatmentService } from '../../services/treatment.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { TreatmentPlan } from '../../types';

const planSchema = z.object({
  diagnosis_id: z.string().min(1),
  treating_doctor_id: z.string().min(1),
  plan_type: z.enum(['Chemotherapy', 'Radiation', 'Surgery', 'Palliative']),
  protocol_name: z.string().min(1),
  treatment_goal: z.enum(['Curative', 'Palliative', 'Preventive']),
  priority: z.enum(['urgent', 'high', 'normal']),
  start_date: z.string().min(1),
  expected_end_date: z.string().min(1),
  total_cycles: z.coerce.number().min(1),
  status: z.enum(['ongoing', 'completed', 'cancelled', 'on-hold']),
  response_status: z.string(),
  notes: z.string(),
});

type PlanForm = z.infer<typeof planSchema>;

export default function TreatmentPlansPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['treatment-plans', page],
    queryFn: () => treatmentService.getPlans({ page, pageSize: 10 }),
  });

  const createMut = useMutation({
    mutationFn: (d: PlanForm) => treatmentService.createPlan({ ...d, end_date: null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatment-plans'] }); toast.success(t('treatment.planCreated')); setShowForm(false); },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => treatmentService.updatePlan(id, { status: status as TreatmentPlan['status'] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatment-plans'] }); toast.success(t('treatment.statusUpdated')); },
  });

  const methods = useForm<PlanForm>({ resolver: zodResolver(planSchema), defaultValues: { status: 'ongoing', plan_type: 'Chemotherapy', treatment_goal: 'Curative', priority: 'normal', total_cycles: 1, response_status: '', notes: '' } });

  const diagnoses = store.diagnoses;
  const doctors = store.doctors;

  const columns: Column<TreatmentPlan>[] = [
    { key: 'protocol_name', header: t('common.title'), sortable: true, render: (v) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{String(v)}</span> },
    { key: 'diagnosis_id', header: t('treatment.diagnosis'), render: (v) => { const d = diagnoses.find((dg) => dg.diagnosis_id === String(v)); return d ? `${d.diagnosis_id} (${formatDate(d.diagnosis_date)})` : String(v); }},
    { key: 'start_date', header: t('treatment.start'), render: (v) => formatDate(String(v)) },
    { key: 'status', header: t('common.status.label'), render: (v, row) => (
      <select
        value={String(v)}
        onChange={(e) => statusMut.mutate({ id: row.plan_id, status: e.target.value })}
        className="text-xs px-2 py-1 rounded-lg border-0 font-semibold cursor-pointer"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="ongoing">Ongoing</option>
        <option value="on-hold">On Hold</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('treatment.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('treatment.subtitle')}</p>
      </div>

      <DataTable<TreatmentPlan>
        columns={columns}
        data={data?.data || []}
        totalItems={data?.total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        isLoading={isLoading}
        headerActions={
          <button onClick={() => { methods.reset(); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> {t('treatment.addPlan')}
          </button>
        }
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('treatment.addPlanTitle')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="protocol_name" label={t('common.title')} required />
              <FormField name="diagnosis_id" label={t('treatment.diagnosis')} type="select" required options={diagnoses.map((d) => ({ value: d.diagnosis_id, label: `${d.diagnosis_id} - ${formatDate(d.diagnosis_date)}` }))} />
              <FormField name="treating_doctor_id" label={t('diagnoses.doctor')} type="select" required options={doctors.map((d) => ({ value: d.doctor_id, label: `${t('common.doctorPrefix')} ${d.full_name}` }))} />
              <FormField name="plan_type" label={t('treatment.planType')} type="select" required options={[{ value: 'Chemotherapy', label: 'Chemotherapy' }, { value: 'Radiation', label: 'Radiation' }, { value: 'Surgery', label: 'Surgery' }, { value: 'Palliative', label: 'Palliative' }]} />
              <FormField name="treatment_goal" label={t('treatment.goal')} type="select" required options={[{ value: 'Curative', label: 'Curative' }, { value: 'Palliative', label: 'Palliative' }, { value: 'Preventive', label: 'Preventive' }]} />
              <FormField name="priority" label={t('treatment.priority')} type="select" required options={[{ value: 'urgent', label: 'Urgent' }, { value: 'high', label: 'High' }, { value: 'normal', label: 'Normal' }]} />
              <FormField name="total_cycles" label={t('treatment.totalCycles')} type="number" required />
              <FormField name="start_date" label={t('treatment.startDate')} type="date" required />
              <FormField name="expected_end_date" label={t('treatment.expectedEndDate')} type="date" required />
              <FormField name="status" label={t('common.status.label')} type="select" options={[{ value: 'ongoing', label: 'Ongoing' }, { value: 'on-hold', label: 'On Hold' }]} />
            </div>
            <FormField name="notes" label={t('common.description')} type="textarea" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('treatment.createPlan')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
