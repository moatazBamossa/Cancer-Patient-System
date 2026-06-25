import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Award, Heart, Search, Edit2, Trash2, X } from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { doctorService, type DoctorWithClinic } from '../../services/doctor.service';
import { Modal } from '../../components/ui/Modal';
import { AppForm } from '../../components/ui/AppForm';
import { FormField, FormSelectField } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { zodValidator } from '../../lib/zodValidator';
import { getInitials } from '../../lib/utils';
import type { DoctorFormInput } from '../../types';

type DoctorForm = DoctorFormInput;

export default function DoctorsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editDoctor, setEditDoctor] = useState<DoctorWithClinic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorWithClinic | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [formKey, setFormKey] = useState(0);

  const doctorSchema = z.object({
    full_name: z.string().min(1, t('doctors.fullNameRequired')),
    specialty: z.string().min(1, t('doctors.specialtyRequired')),
    clinic_id: z.string().min(1, t('doctors.clinicRequired')),
    license_number: z.string().min(1, t('doctors.licenseRequired')),
    phone: z.string().min(1, t('doctors.phoneRequired')),
    email: z.string().min(1, t('doctors.emailRequired')).email(t('patients.invalidEmail')),
    is_active: z.enum(['true', 'false']),
  });

  type DoctorFormValues = z.infer<typeof doctorSchema>;

  const defaultFormValues: DoctorFormValues = {
    full_name: '',
    specialty: '',
    clinic_id: '',
    license_number: '',
    phone: '',
    email: '',
    is_active: 'true',
  };

  const [formInitialValues, setFormInitialValues] = useState<DoctorFormValues>(defaultFormValues);

  const {
    data: doctors = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['doctors', appliedSearch],
    queryFn: () =>
      appliedSearch.trim()
        ? doctorService.searchByName(appliedSearch.trim())
        : doctorService.getAll(),
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: () => doctorService.getClinics(),
  });

  const invalidateDoctors = () => qc.invalidateQueries({ queryKey: ['doctors'] });

  const createMut = useMutation({
    mutationFn: (d: DoctorForm) => doctorService.create(d),
    onSuccess: () => {
      invalidateDoctors();
      toast.success(t('doctors.doctorAdded'));
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message || t('common.error')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoctorForm }) => doctorService.update(id, data),
    onSuccess: () => {
      invalidateDoctors();
      toast.success(t('doctors.doctorUpdated'));
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message || t('common.error')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => doctorService.delete(id),
    onSuccess: () => {
      invalidateDoctors();
      toast.success(t('doctors.doctorDeleted'));
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || t('common.error')),
  });

  const toFormValues = (doctor: DoctorWithClinic): DoctorFormValues => ({
    full_name: doctor.full_name,
    specialty: doctor.specialty,
    clinic_id: doctor.clinic_id,
    license_number: doctor.license_number,
    phone: doctor.phone,
    email: doctor.email,
    is_active: doctor.is_active ? 'true' : 'false',
  });

  const toDoctorInput = (values: DoctorFormValues): DoctorForm => ({
    full_name: values.full_name,
    specialty: values.specialty,
    clinic_id: values.clinic_id,
    license_number: values.license_number,
    phone: values.phone,
    email: values.email,
    is_active: values.is_active === 'true',
  });

  const openAddForm = () => {
    setEditDoctor(null);
    setFormInitialValues(defaultFormValues);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const openEditForm = (doctor: DoctorWithClinic) => {
    setEditDoctor(doctor);
    setFormInitialValues(toFormValues(doctor));
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditDoctor(null);
  };

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleSubmit = (values: DoctorFormValues) => {
    const payload = toDoctorInput(values);
    if (editDoctor) {
      updateMut.mutate({ id: editDoctor.doctor_id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;
  const clinicOptions = clinics.map((cl) => ({
    value: String(cl.clinic_id),
    label: cl.clinic_name,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('doctors.title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('doctors.subtitle')}
          </p>
        </div>
        <button onClick={openAddForm} className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5 self-start">
          <Plus size={16} /> {t('doctors.newDoctor')}
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('doctors.searchByName')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('doctors.searchPlaceholder')}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={isFetching}
              className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5 disabled:opacity-60"
            >
              <Search size={16} />
              {t('common.searchAction')}
            </button>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-4 py-2 text-sm rounded-lg border flex items-center gap-1.5"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
              }}
            >
              <X size={16} />
              {t('common.clear')}
            </button>
          </div>
        </div>
        {!isLoading && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {appliedSearch
              ? t('doctors.searchResults', { count: doctors.length, query: appliedSearch })
              : t('doctors.totalDoctors', { count: doctors.length })}
          </p>
        )}
      </div>

      {isError && (
        <div className="glass-card p-4 border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-500">
            {(error as Error)?.message || t('doctors.loadError')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-64 animate-pulse bg-slate-500/5" />
          ))}

        {!isLoading && doctors.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center">
            <p style={{ color: 'var(--text-muted)' }}>
              {appliedSearch ? t('doctors.noSearchResults') : t('doctors.noDoctors')}
            </p>
          </div>
        )}

        {!isLoading &&
          doctors.map((doc) => (
            <motion.div
              key={doc.doctor_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden flex flex-col items-center text-center p-8 group relative"
            >
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => openEditForm(doc)}
                  className="p-1.5 rounded-lg hover:bg-amber-500/10"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={t('common.edit')}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(doc)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="relative mb-6">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-2xl transition-transform group-hover:rotate-6"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {getInitials(doc.full_name)}
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-500 text-white shadow-lg border-2 border-white dark:border-slate-900">
                  <Award size={16} />
                </div>
              </div>

              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {doc.full_name}
              </h3>
              <p className="text-sm font-semibold text-indigo-500 mb-2">{doc.specialty}</p>

              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-4 ${
                  doc.is_active
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-slate-500/10 text-slate-500'
                }`}
              >
                {doc.is_active ? t('profile.active') : t('profile.inactive')}
              </span>

              <div className="space-y-3 w-full border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
                <div
                  className="flex items-center justify-center gap-2 text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Heart size={14} className="text-red-500" />
                  {doc.clinic_name || t('common.unknown')}
                </div>
                <div
                  className="flex items-center justify-center gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Award size={14} />
                  {doc.license_number}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {doc.phone} · {doc.email}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editDoctor ? t('doctors.editTitle') : t('doctors.addTitle')}
        size="md"
      >
        <AppForm<DoctorFormValues>
          formKey={formKey}
          initialValues={formInitialValues}
          validate={zodValidator(doctorSchema)}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <FormField name="full_name" label={t('doctors.fullName')} required />
          <FormField name="specialty" label={t('doctors.specialization')} required />
          <FormSelectField
							name="clinic_id"
							label={t('doctors.primaryClinic')}
							required
							options={clinicOptions}
						/>
          <FormField name="license_number" label={t('doctors.licenseNumber')} required />
          <FormField name="phone" label={t('common.phone')} type="tel" required />
          <FormField name="email" label={t('common.email')} type="email" required />
          <FormField
            name="is_active"
            label={t('doctors.activeStatus')}
            type="select"
            required
            options={[
              { value: 'true', label: t('profile.active') },
              { value: 'false', label: t('profile.inactive') },
            ]}
          />
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-60"
            >
              {isSubmitting
                ? t('common.saving')
                : editDoctor
                  ? t('common.save')
                  : t('doctors.registerDoctor')}
            </button>
          </div>
        </AppForm>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.doctor_id)}
        title={t('common.delete')}
        message={t('doctors.deleteConfirm', { name: deleteTarget?.full_name ?? '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </motion.div>
  );
}
