import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FlaskConical, AlertCircle } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { labService } from '../../services/general.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { LabTestResult } from '../../types';

const labResultSchema = z.object({
  patient_id: z.string().min(1),
  lab_test_id: z.string().min(1),
  test_date: z.string().min(1),
  result_value: z.string().min(1),
  is_abnormal: z.boolean(),
  notes: z.string().optional().default(''),
  ordered_by: z.string().min(1),
});

type LabResultForm = z.infer<typeof labResultSchema>;

export default function LabTestsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ['lab-results'],
    queryFn: async () => store.lab_test_results,
  });

  const createMut = useMutation({
    mutationFn: (d: LabResultForm) => labService.addResult({ ...d, cycle_id: null, visit_id: null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lab-results'] }); toast.success(t('lab.resultAdded')); setShowForm(false); },
  });

  const methods = useForm<LabResultForm>({ resolver: zodResolver(labResultSchema), defaultValues: { is_abnormal: false } });

  const columns: Column<LabTestResult>[] = [
    { key: 'test_date', header: t('common.date'), render: (v) => formatDate(String(v)) },
    { key: 'patient_id', header: t('diagnoses.patient'), render: (v) => {
      const p = store.patients.find(pt => pt.patient_id === v);
      return <span className="font-medium text-emerald-500">{p ? p.full_name : t('common.unknown')}</span>;
    }},
    { key: 'lab_test_id', header: t('lab.testName'), render: (v) => {
      const test = store.lab_tests.find(t => t.lab_test_id === v);
      return <span className="font-medium text-indigo-500">{test?.test_name}</span>;
    }},
    { key: 'result_value', header: t('lab.result'), render: (_, row) => {
      const test = store.lab_tests.find(t => t.lab_test_id === row.lab_test_id);
      return (
        <div className="flex items-center gap-2">
          <span className={`font-bold ${row.is_abnormal ? 'text-red-500' : 'text-emerald-500'}`}>
            {row.result_value} {test?.units}
          </span>
          {row.is_abnormal && <AlertCircle size={14} className="text-red-500" />}
        </div>
      );
    }},
    { key: 'is_abnormal', header: t('common.status.label'), render: (v) => (
      <StatusBadge status={v ? 'low' : 'normal'} /> // Using 'low' as a generic abnormal color
    )},
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('lab.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('lab.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> {t('lab.addResult')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-indigo-500">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
            <FlaskConical size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('lab.totalTests')}</p>
            <p className="text-2xl font-bold">{store.lab_tests.length}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <FlaskConical size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('lab.resultsRecorded')}</p>
            <p className="text-2xl font-bold">{results?.length || 0}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-red-500">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t('lab.abnormalResults')}</p>
            <p className="text-2xl font-bold text-red-500">{results?.filter(r => r.is_abnormal).length || 0}</p>
          </div>
        </div>
      </div>

      <DataTable<LabTestResult>
        columns={columns}
        data={results || []}
        isLoading={isLoading}
        searchPlaceholder={t('lab.searchPlaceholder')}
        emptyMessage={t('lab.noResults')}
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('lab.addResultTitle')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="patient_id" label={t('diagnoses.patient')} type="select" required options={store.patients.map(p => ({ value: p.patient_id, label: p.full_name }))} />
              <FormField name="lab_test_id" label={t('lab.testName')} type="select" required options={store.lab_tests.map(t => ({ value: t.lab_test_id, label: `${t.test_name} (${t.category})` }))} />
              <FormField name="test_date" label={t('lab.date')} type="datetime-local" required />
              <FormField name="ordered_by" label={t('imaging.radiologist')} type="select" required options={store.doctors.map(d => ({ value: d.doctor_id, label: d.full_name }))} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField name="result_value" label={t('lab.resultValue')} required />
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                  <input type="checkbox" {...methods.register('is_abnormal')} className="rounded border-slate-300" />
                  {t('common.status.low')} / {t('common.status.high')} (Is Abnormal)
                </label>
              </div>
            </div>

            <FormField name="notes" label={t('common.notes')} type="textarea" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('lab.saveResult')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
