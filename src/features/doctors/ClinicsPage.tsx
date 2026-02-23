import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Building2, MapPin, Phone } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { doctorService } from '../../services/doctor.service';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import type { Clinic } from '../../types';

const clinicSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  phone: z.string().min(1),
  description: z.string().optional(),
});

type ClinicForm = z.infer<typeof clinicSchema>;

export default function ClinicsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => doctorService.getClinics(),
  });

  const createMut = useMutation({
    mutationFn: (d: ClinicForm) => doctorService.addClinic({ ...d, description: d.description || '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinics'] }); toast.success('Clinic added'); setShowForm(false); },
  });

  const methods = useForm<ClinicForm>({ resolver: zodResolver(clinicSchema) });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Clinics & Departments</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage medical centers and their locations</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> New Clinic
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 h-48 animate-pulse bg-slate-500/5" />
        ))}
        {clinics?.map((clinic) => (
          <motion.div
            key={clinic.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group glass-card p-6 border-b-4 border-indigo-500 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{clinic.name}</h3>
            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{clinic.description}</p>
            
            <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={14} className="text-indigo-500" />
                {clinic.location}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Phone size={14} className="text-indigo-500" />
                {clinic.phone}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Clinic" size="md">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <FormField name="name" label="Clinic Name" required />
            <FormField name="location" label="Location" required />
            <FormField name="phone" label="Phone" required />
            <FormField name="description" label="Description" type="textarea" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">Add Clinic</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
