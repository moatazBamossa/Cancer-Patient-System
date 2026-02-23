import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, ImageIcon, FileText, Search } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { imagingService } from '../../services/general.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { ImagingReport } from '../../types';

const imagingSchema = z.object({
  patient_id: z.string().min(1),
  type: z.string().min(1),
  body_part: z.string().min(1),
  date: z.string().min(1),
  findings: z.string().min(1),
  impression: z.string().min(1),
  radiologist: z.string().min(1),
  image_url: z.string().optional(),
});

type ImagingForm = z.infer<typeof imagingSchema>;

export default function ImagingPage() {
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
    mutationFn: (d: ImagingForm) => imagingService.add(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['imaging-reports'] }); toast.success('Report added'); setShowForm(false); },
  });

  const methods = useForm<ImagingForm>({ resolver: zodResolver(imagingSchema) });

  const filteredReports = reports?.filter(r => {
    const p = store.patients.find(pt => pt.id === r.patient_id);
    const searchStr = `${p?.first_name} ${p?.last_name} ${r.type} ${r.body_part} ${r.impression}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  }) || [];

  const columns: Column<ImagingReport>[] = [
    { key: 'date', header: 'Date', render: (v) => formatDate(String(v)) },
    { key: 'patient_id', header: 'Patient', render: (v) => {
      const p = store.patients.find(pt => pt.id === v);
      return <span className="font-medium text-emerald-500">{p ? `${p.first_name} ${p.last_name}` : 'Unknown'}</span>;
    }},
    { key: 'type', header: 'Modality', render: (v) => <span className="uppercase font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">{String(v)}</span> },
    { key: 'body_part', header: 'Body Part' },
    { key: 'radiologist', header: 'Radiologist' },
    { key: 'impression', header: 'Impression', render: (v) => <span className="truncate max-w-[200px] block">{String(v)}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Imaging Reports</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Radiology, scanning and imaging results</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> New Report
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by patient, modality, or findings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredReports as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedReport(row as unknown as ImagingReport)}
        emptyMessage="No imaging reports found"
      />

      {/* View Details Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Imaging Report Details" size="lg">
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-500/5">
              <div>
                <p className="text-xs font-semibold text-slate-500">Patient</p>
                <p className="font-medium text-indigo-500">
                  {store.patients.find(p => p.id === selectedReport.patient_id)?.first_name} {store.patients.find(p => p.id === selectedReport.patient_id)?.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Date</p>
                <p className="font-medium">{formatDate(selectedReport.date)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Modality</p>
                <p className="font-medium uppercase">{selectedReport.type}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Body Part</p>
                <p className="font-medium">{selectedReport.body_part}</p>
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
                <FileText size={16} className="text-indigo-500" />
                Findings
              </h4>
              <p className="text-sm leading-relaxed p-4 rounded-lg bg-slate-500/5 border border-slate-500/10">
                {selectedReport.findings}
              </p>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
                <ImageIcon size={16} className="text-indigo-500" />
                Impression/Conclusion
              </h4>
              <p className="text-sm border-l-4 border-indigo-500 pl-4 py-2 italic font-medium">
                {selectedReport.impression}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t text-xs text-slate-500">
              <p>Radiologist: {selectedReport.radiologist}</p>
              <p>Report ID: {selectedReport.id}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Report Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Upload Imaging Report" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <FormField name="patient_id" label="Patient" type="select" required options={store.patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
            <div className="grid grid-cols-2 gap-4">
              <FormField name="type" label="Type (e.g. MRI, CT)" required />
              <FormField name="body_part" label="Body Part" required />
              <FormField name="date" label="Scan Date" type="date" required />
              <FormField name="radiologist" label="Radiologist" required />
            </div>
            <FormField name="findings" label="Findings" type="textarea" required />
            <FormField name="impression" label="Impression" type="textarea" required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Upload Report</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
