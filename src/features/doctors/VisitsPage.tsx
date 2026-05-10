import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { doctorService } from '../../services/doctor.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate, formatTime } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { ClinicVisit } from '../../types';

export default function VisitsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const visitSchema = z.object({
    patient_id: z.string().min(1),
    doctor_id: z.string().min(1),
    visit_date: z.string().min(1),
    visit_type: z.enum(['Follow-up', 'Emergency', 'Routine', 'Post-treatment']),
    reason_for_visit: z.string().min(1),
    clinical_notes: z.string().optional().default(''),
    recommendations: z.string().optional().default(''),
    next_visit_date: z.string().optional().default(''),
    diagnosis_id: z.string().optional().default(''),
  });

  type VisitForm = z.infer<typeof visitSchema>;

  const { data, isLoading } = useQuery({
    queryKey: ['visits', page],
    queryFn: () => doctorService.getVisits({ page, pageSize: 12 }),
  });

  const createMut = useMutation({
    mutationFn: (d: VisitForm) => doctorService.createVisit({
      ...d,
      diagnosis_id: d.diagnosis_id || null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); toast.success(t('visits.visitScheduled')); setShowForm(false); },
  });

  const methods = useForm<VisitForm>({ resolver: zodResolver(visitSchema), defaultValues: { visit_type: 'Routine' } });

  const columns: Column<ClinicVisit>[] = [
    { key: 'visit_date', header: t('visits.dateTime'), sortable: true, render: (v) => (
      <div className="flex flex-col">
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(String(v))}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{formatTime(String(v))}</span>
      </div>
    )},
    { key: 'patient_id', header: t('diagnoses.patient'), render: (v) => {
      const p = store.patients.find(pt => pt.patient_id === v);
      return <span className="font-medium">{p ? p.full_name : t('common.unknown')}</span>;
    }},
    { key: 'doctor_id', header: t('diagnoses.doctor'), render: (v) => {
      const d = store.doctors.find(dc => dc.doctor_id === v);
      return <span className="text-indigo-500 font-medium">{d ? `${t('common.doctorPrefix')} ${d.full_name}` : t('common.unknown')}</span>;
    }},
    { key: 'visit_type', header: t('visits.type'), render: (v) => {
      const colors: Record<string, string> = { 'Follow-up': 'bg-emerald-500/10 text-emerald-500', 'Emergency': 'bg-red-500/10 text-red-500', 'Routine': 'bg-blue-500/10 text-blue-500', 'Post-treatment': 'bg-purple-500/10 text-purple-500' };
      return <span className={`text-[10px] items-center gap-1.5 px-2 py-0.5 rounded-full font-bold uppercase ${colors[String(v)] || colors.Routine}`}>{String(v)}</span>;
    }},
    { key: 'reason_for_visit', header: t('visits.reasonForVisit'), render: (v) => <span className="truncate max-w-[150px] block text-xs">{String(v)}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('visits.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('visits.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> {t('visits.scheduleVisit')}
        </button>
      </div>

      <DataTable<ClinicVisit>
        columns={columns}
        data={data?.data || []}
        totalItems={data?.total}
        page={page}
        pageSize={12}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder={t('visits.searchPlaceholder')}
        emptyMessage={t('visits.noVisits')}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('visits.scheduleTitle')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="patient_id" label={t('diagnoses.patient')} type="select" required options={store.patients.map(p => ({ value: p.patient_id, label: p.full_name }))} />
              <FormField name="doctor_id" label={t('diagnoses.doctor')} type="select" required options={store.doctors.map(d => ({ value: d.doctor_id, label: `${t('common.doctorPrefix')} ${d.full_name}` }))} />
              <FormField name="visit_date" label={t('visits.dateTime')} type="datetime-local" required />
              <FormField name="visit_type" label={t('visits.visitType')} type="select" required options={[
                { value: 'Follow-up', label: t('visits.followUp') },
                { value: 'Emergency', label: t('visits.emergency') },
                { value: 'Routine', label: t('visits.regular') },
                { value: 'Post-treatment', label: t('visits.postTreatment') },
              ]} />
            </div>
            <FormField name="reason_for_visit" label={t('visits.reasonForVisit')} required />
            <FormField name="clinical_notes" label={t('visits.consultationNotes')} type="textarea" />
            <FormField name="recommendations" label={t('visits.recommendations')} type="textarea" />
            <FormField name="next_visit_date" label={t('visits.nextVisitDate')} type="date" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('visits.scheduleAppointment')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
