import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Building2, MapPin, Phone } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { doctorService } from '../../services/doctor.service';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import type { Clinic } from '../../types';

const clinicSchema = z.object({
  clinic_name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
});

type ClinicForm = z.infer<typeof clinicSchema>;

export default function ClinicsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => doctorService.getClinics(),
  });

  const createMut = useMutation({
    mutationFn: (d: ClinicForm) => doctorService.createClinic(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clinics'] }); toast.success(t('clinics.clinicAdded')); setShowForm(false); },
  });

  const methods = useForm<ClinicForm>({ resolver: zodResolver(clinicSchema) });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('clinics.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('clinics.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> {t('clinics.newClinic')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 h-48 animate-pulse bg-slate-500/5" />
        ))}
        {clinics?.map((clinic) => (
          <motion.div
            key={clinic.clinic_id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group glass-card p-6 border-b-4 border-indigo-500 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <Building2 size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{clinic.clinic_name}</h3>
            
            <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={14} className="text-indigo-500" />
                {clinic.address}
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Phone size={14} className="text-indigo-500" />
                {clinic.phone}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('clinics.addTitle')} size="md">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <FormField name="clinic_name" label={t('clinics.clinicName')} required />
            <FormField name="address" label={t('clinics.location')} required />
            <FormField name="phone" label={t('clinics.phone')} required />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('clinics.addClinic')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
