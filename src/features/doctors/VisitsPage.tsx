import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Calendar, Clock, MapPin, User, Search } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { doctorService } from '../../services/doctor.service';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { formatDate, formatDateTime } from '../../lib/utils';
import { getDataStore } from '../../services/mockApi';
import type { ClinicVisit } from '../../types';

const visitSchema = z.object({
  patient_id: z.string().min(1),
  doctor_id: z.string().min(1),
  visit_date: z.string().min(1),
  visit_type: z.enum(['regular', 'emergency', 'follow_up', 'chemo_session']),
  chief_complaint: z.string().min(1),
  notes: z.string().optional(),
});

type VisitForm = z.infer<typeof visitSchema>;

export default function VisitsPage() {
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['visits', page],
    queryFn: () => doctorService.getVisits({ page, pageSize: 12 }),
  });

  const createMut = useMutation({
    mutationFn: (d: VisitForm) => doctorService.addVisit({ ...d, notes: d.notes || '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['visits'] }); toast.success('Visit scheduled'); setShowForm(false); },
  });

  const methods = useForm<VisitForm>({ resolver: zodResolver(visitSchema), defaultValues: { visit_type: 'regular' } });

  const columns: Column<ClinicVisit>[] = [
    { key: 'visit_date', header: 'Date & Time', sortable: true, render: (v) => (
      <div className="flex flex-col">
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(String(v))}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{new Date(String(v)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    )},
    { key: 'patient_id', header: 'Patient', render: (v) => {
      const p = store.patients.find(pt => pt.id === v);
      return <span className="font-medium">{p ? `${p.first_name} ${p.last_name}` : 'Unknown'}</span>;
    }},
    { key: 'doctor_id', header: 'Doctor', render: (v) => {
      const d = store.doctors.find(dc => dc.id === v);
      const u = d ? store.users.find(us => us.id === d.user_id) : null;
      return <span className="text-indigo-500 font-medium">Dr. {u?.full_name}</span>;
    }},
    { key: 'visit_type', header: 'Type', render: (v) => {
      const colors: Record<string, string> = { regular: 'bg-blue-500/10 text-blue-500', emergency: 'bg-red-500/10 text-red-500', follow_up: 'bg-emerald-500/10 text-emerald-500', chemo_session: 'bg-purple-500/10 text-purple-500' };
      return <span className={`text-[10px] items-center gap-1.5 px-2 py-0.5 rounded-full font-bold uppercase ${colors[String(v)] || colors.regular}`}>{String(v).replace('_', ' ')}</span>;
    }},
    { key: 'chief_complaint', header: 'Chief Complaint', render: (v) => <span className="truncate max-w-[150px] block text-xs">{String(v)}</span> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Clinic Visits</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Appointments and patient visits history</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> Schedule Visit
        </button>
      </div>

      <DataTable
        columns={columns}
        data={(data?.data || []) as unknown as Record<string, unknown>[]}
        totalItems={data?.total}
        page={page}
        pageSize={12}
        onPageChange={setPage}
        isLoading={isLoading}
        searchPlaceholder="Search visits..."
        emptyMessage="No visits scheduled"
      />

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Schedule Clinic Visit" size="lg">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField name="patient_id" label="Patient" type="select" required options={store.patients.map(p => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))} />
              <FormField name="doctor_id" label="Doctor" type="select" required options={store.doctors.map(d => ({ value: d.id, label: `Dr. ${store.users.find(u => u.id === d.user_id)?.full_name}` }))} />
              <FormField name="visit_date" label="Date & Time" type="datetime-local" required />
              <FormField name="visit_type" label="Visit Type" type="select" required options={[
                { value: 'regular', label: 'Regular' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'follow_up', label: 'Follow Up' },
                { value: 'chemo_session', label: 'Chemo Session' },
              ]} />
            </div>
            <FormField name="chief_complaint" label="Chief Complaint" required />
            <FormField name="notes" label="Consultation Notes" type="textarea" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Schedule Appointment</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
