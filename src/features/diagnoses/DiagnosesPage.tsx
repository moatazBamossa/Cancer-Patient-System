import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { diagnosisService } from '../../services/diagnosis.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { Diagnosis } from '../../types';

export default function DiagnosesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [editDiagnosis, setEditDiagnosis] = useState<Diagnosis | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Diagnosis | null>(null);
  const [page, setPage] = useState(1);

  const diagSchema = z.object({
    patient_id: z.string().min(1, t('diagnoses.patientRequired')),
    cancer_id: z.string().min(1, t('diagnoses.cancerTypeRequired')),
    supervising_doctor_id: z.string().min(1, t('diagnoses.doctorRequired')),
    diagnosis_date: z.string().min(1, t('diagnoses.dateRequired')),
    notes: z.string().min(1, t('diagnoses.notesRequired')),
    status: z.enum(['active', 'resolved', 'transferred']),
  });

  type DiagForm = z.infer<typeof diagSchema>;

  const { data, isLoading } = useQuery({
    queryKey: ['diagnoses', page],
    queryFn: () => diagnosisService.getAll({ page, pageSize: 10 }),
  });

  const createMut = useMutation({
    mutationFn: (d: DiagForm) => diagnosisService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnoses'] }); toast.success(t('diagnoses.created')); setShowForm(false); },
  });

  const updateMut = useMutation({
    mutationFn: (d: DiagForm) => diagnosisService.update(editDiagnosis!.diagnosis_id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnoses'] }); toast.success(t('common.updateSuccess')); setShowForm(false); setEditDiagnosis(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => diagnosisService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['diagnoses'] }); toast.success(t('common.deleteSuccess')); setDeleteTarget(null); },
  });

  const methods = useForm<DiagForm>({ resolver: zodResolver(diagSchema), defaultValues: { status: 'active' } });

  const handleEdit = (diag: Diagnosis) => {
    setEditDiagnosis(diag);
    methods.reset({
      patient_id: diag.patient_id,
      cancer_id: diag.cancer_id,
      supervising_doctor_id: diag.supervising_doctor_id,
      diagnosis_date: diag.diagnosis_date.split('T')[0],
      notes: diag.notes,
      status: diag.status,
    });
    setShowForm(true);
  };

  const patients = store.patients;
  const doctors = store.doctors;
  const cancerTypes = store.cancer_types;

  const columns: Column<Diagnosis>[] = [
    { key: 'patient_id', header: t('diagnoses.patient'), render: (v) => {
      const p = patients.find((pt) => pt.patient_id === String(v));
      return <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p ? p.full_name : t('common.unknown')}</span>;
    }},
    { key: 'cancer_id', header: t('diagnoses.cancerType'), render: (v) => {
      const ct = cancerTypes.find((c) => c.cancer_id === String(v));
      return ct ? <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ct.color }} />{ct.cancer_name}</div> : t('common.unknown');
    }},
    { key: 'supervising_doctor_id', header: t('diagnoses.doctor'), render: (v) => {
      const doc = doctors.find((d) => d.doctor_id === String(v));
      return doc ? `${t('common.doctorPrefix')} ${doc.full_name}` : t('common.unknown');
    }},
    { key: 'diagnosis_date', header: t('common.date'), sortable: true, render: (v) => formatDate(String(v)) },
    { key: 'status', header: t('common.status.label'), render: (v) => <StatusBadge status={String(v)} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('diagnoses.title')}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('diagnoses.subtitle')}</p>
      </div>

      <DataTable<Diagnosis>
        columns={columns}
        data={data?.data || []}
        totalItems={data?.total}
        page={page}
        pageSize={10}
        onPageChange={setPage}
        isLoading={isLoading}
        headerActions={
          <button onClick={() => { methods.reset({ status: 'active' }); setEditDiagnosis(null); setShowForm(true); }} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
            <Plus size={16} /> {t('diagnoses.addDiagnosis')}
          </button>
        }
        actions={(row) => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-1.5 rounded-lg transition-colors hover:bg-amber-500/10" style={{ color: 'var(--text-muted)' }}>
              <Edit2 size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'var(--text-muted)' }}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditDiagnosis(null); }} title={editDiagnosis ? t('common.edit') : t('diagnoses.addDiagnosis')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit((d) => editDiagnosis ? updateMut.mutate(d) : createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="patient_id" label={t('diagnoses.patient')} type="select" required options={patients.map((p) => ({ value: p.patient_id, label: p.full_name }))} />
              <FormField name="cancer_id" label={t('diagnoses.cancerType')} type="select" required options={cancerTypes.map((ct) => ({ value: ct.cancer_id, label: ct.cancer_name }))} />
              <FormField name="supervising_doctor_id" label={t('diagnoses.doctor')} type="select" required options={doctors.map((d) => ({ value: d.doctor_id, label: `${t('common.doctorPrefix')} ${d.full_name}` }))} />
              <FormField name="diagnosis_date" label={t('common.date')} type="date" required />
              <FormField name="status" label={t('common.status.label')} type="select" required options={[
                { value: 'active', label: t('common.status.active') },
                { value: 'resolved', label: t('common.status.resolved') },
                { value: 'transferred', label: t('common.status.transferred') },
              ]} />
            </div>
            <FormField name="notes" label={t('common.notes')} type="textarea" required />
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="gradient-btn px-6 py-2.5 text-sm">
                {editDiagnosis ? t('common.save') : t('diagnoses.createDiagnosis')}
              </button>
            </div>
          </form>
        </FormProvider>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.diagnosis_id)}
        title={t('common.delete')}
        message={t('common.confirm')}
      />
    </motion.div>
  );
}
