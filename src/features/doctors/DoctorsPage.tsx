import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Award, Heart } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { doctorService } from '../../services/doctor.service';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { getDataStore } from '../../services/mockApi';
import { getInitials } from '../../lib/utils';
import type { Doctor } from '../../types';

const doctorSchema = z.object({
  full_name: z.string().min(1),
  specialty: z.string().min(1),
  clinic_id: z.string().min(1),
  license_number: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().or(z.literal('')),
});

type DoctorForm = z.infer<typeof doctorSchema>;

export default function DoctorsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const store = getDataStore();
  const [showForm, setShowForm] = useState(false);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorService.getAll(),
  });

  const createMut = useMutation({
    mutationFn: (d: DoctorForm) => doctorService.create({ ...d, is_active: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctors'] }); toast.success(t('doctors.doctorAdded')); setShowForm(false); },
  });

  const methods = useForm<DoctorForm>({ resolver: zodResolver(doctorSchema) });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('doctors.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('doctors.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5">
          <Plus size={16} /> {t('doctors.newDoctor')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-6 h-64 animate-pulse bg-slate-500/5" />
        ))}
        {doctors?.map((doc) => {
          const c = store.clinics.find(cl => cl.clinic_id === doc.clinic_id);
          return (
            <motion.div
              key={doc.doctor_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden flex flex-col items-center text-center p-8 group"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-2xl transition-transform group-hover:rotate-6"
                     style={{ background: 'var(--accent-gradient)' }}>
                  {getInitials(doc.full_name)}
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-500 text-white shadow-lg border-2 border-white dark:border-slate-900">
                  <Award size={16} />
                </div>
              </div>
              
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{doc.full_name}</h3>
              <p className="text-sm font-semibold text-indigo-500 mb-4">{doc.specialty}</p>
              
              <div className="space-y-3 w-full border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Heart size={14} className="text-red-500" />
                  {c?.clinic_name}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Award size={14} />
                  {doc.license_number}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={t('doctors.addTitle')} size="md">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(d => createMut.mutate(d))} className="space-y-4">
            <FormField name="full_name" label={t('doctors.fullName')} required />
            <FormField name="specialty" label={t('doctors.specialization')} required />
            <FormField name="clinic_id" label={t('doctors.primaryClinic')} type="select" required options={store.clinics.map(cl => ({ value: cl.clinic_id, label: cl.clinic_name }))} />
            <FormField name="license_number" label={t('doctors.licenseNumber')} required />
            <FormField name="phone" label={t('common.phone')} required />
            <FormField name="email" label={t('common.email')} type="email" />
            <div className="flex justify-end pt-4"><button type="submit" className="gradient-btn px-6 py-2.5 text-sm">{t('doctors.registerDoctor')}</button></div>
          </form>
        </FormProvider>
      </Modal>
    </motion.div>
  );
}
