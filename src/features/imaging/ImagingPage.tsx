import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, ImageIcon, FileText, Search } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { imagingService } from '../../services/general.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { ImagingReport } from '../../types';

const imagingSchema = z.object({
  patient_id: z.string().min(1),
  imaging_type: z.enum(['CT', 'MRI', 'PET', 'X-Ray', 'Ultrasound']),
  body_part: z.string().min(1),
  imaging_date: z.string().min(1),
  findings: z.string().min(1),
  impression: z.string().min(1),
  ordered_by: z.string().min(1),
  report_text: z.string().optional().default(''),
  diagnosis_id: z.string().optional().default(''),
});

type ImagingForm = z.infer<typeof imagingSchema>;

export default function ImagingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['imaging-reports'],
    queryFn: () => imagingService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: (d: ImagingForm) => imagingService.create({ ...d, diagnosis_id: d.diagnosis_id || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['imaging-reports'] }); toast.success(t('imaging.reportAdded')); setShowForm(false); },
  });

  const methods = useForm<ImagingForm>({ resolver: zodResolver(imagingSchema), defaultValues: { imaging_type: 'CT' } });

  const filteredReports = reports?.filter(r => {
    const p = store.patients.find(pt => pt.patient_id === r.patient_id);
    const searchStr = `${p?.full_name} ${r.imaging_type} ${r.body_part} ${r.impression}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  }) || [];

  const columns: Column<ImagingReport>[] = [
    { key: 'imaging_date', header: t('common.date'), render: (v) => formatDate(String(v)) },
    { key: 'patient_id', header: t('diagnoses.patient'), render: (v) => {
      const p = store.patients.find(pt => pt.patient_id === v);
      return <span className="font-medium text-emerald-500">{p ? p.full_name : t('common.unknown')}</span>;
    }},
    { key: 'ordered_by', header: t('imaging.radiologist'), render: (v) => {
      const d = store.doctors.find(doc => doc.doctor_id === v);
      return <span>{d ? d.full_name : t('common.unknown')}</span>;
    }},
    { key: 'imaging_type', header: t('imaging.modality'), render: (v) => <span className="uppercase font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">{String(v)}</span> },
    { key: 'body_part', header: t('imaging.bodyPart') },
    { key: 'impression', header: t('imaging.impression'), render: (v) => <span className="truncate max-w-[200px] block">{String(v)}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('imaging.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('imaging.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> {t('imaging.newReport')}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={t('imaging.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <DataTable<ImagingReport>
        columns={columns}
        data={filteredReports}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedReport(row)}
        emptyMessage={t('imaging.noReports')}
      />

      {/* View Details Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title={t('imaging.detailsTitle')} size="lg">
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-500/5">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('diagnoses.patient')}</p>
                <p className="font-medium text-indigo-500">
                  {store.patients.find(p => p.patient_id === selectedReport.patient_id)?.full_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('common.date')}</p>
                <p className="font-medium">{formatDate(selectedReport.imaging_date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('imaging.modality')}</p>
                <p className="font-medium uppercase">{selectedReport.imaging_type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('imaging.bodyPart')}</p>
                <p className="font-medium">{selectedReport.body_part}</p>
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
                <FileText size={16} className="text-indigo-500" />
                {t('imaging.findings')}
              </h4>
              <p className="text-sm leading-relaxed p-4 rounded-lg bg-slate-500/5 border border-slate-500/10">
                {selectedReport.findings}
              </p>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
                <ImageIcon size={16} className="text-indigo-500" />
                {t('imaging.impressionConclusion')}
              </h4>
              <p className="text-sm border-l-4 border-indigo-500 pl-4 py-2 italic font-medium">
                {selectedReport.impression}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t text-xs text-slate-500">
              <p>{t('imaging.radiologist')}: {store.doctors.find(doc => doc.doctor_id === selectedReport.ordered_by)?.full_name || selectedReport.ordered_by}</p>
              <p>{t('imaging.reportId')}: {selectedReport.image_id}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Report Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('imaging.uploadTitle')} size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <FormField name="patient_id" label={t('diagnoses.patient')} type="select" required options={store.patients.map(p => ({ value: p.patient_id, label: p.full_name }))} />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="imaging_type" label={t('imaging.type')} type="select" required options={['CT', 'MRI', 'PET', 'X-Ray', 'Ultrasound'].map(v => ({ value: v, label: v }))} />
              <FormField name="body_part" label={t('imaging.bodyPart')} required />
              <FormField name="imaging_date" label={t('imaging.scanDate')} type="date" required />
              <FormField name="ordered_by" label={t('imaging.radiologist')} type="select" required options={store.doctors.map((d) => ({ value: d.doctor_id, label: d.full_name }))} />
            </div>
            <FormField name="findings" label={t('imaging.findings')} type="textarea" required />
            <FormField name="impression" label={t('imaging.impression')} type="textarea" required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('imaging.uploadReport')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
