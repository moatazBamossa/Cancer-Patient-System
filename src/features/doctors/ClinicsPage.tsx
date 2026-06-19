import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Building2, MapPin, Phone, Search, Edit2, Trash2, X, Calendar } from 'lucide-react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { doctorService } from '../../services/doctor.service';
import { Modal } from '../../components/ui/Modal';
import { AppForm } from '../../components/ui/AppForm';
import { FormField } from '../../components/ui/FormField';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { zodValidator } from '../../lib/zodValidator';
import { formatDate } from '../../lib/utils';
import type { Clinic, ClinicFormInput } from '../../types';

type ClinicForm = ClinicFormInput;

export default function ClinicsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editClinic, setEditClinic] = useState<Clinic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Clinic | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [formKey, setFormKey] = useState(0);

  const clinicSchema = z.object({
    clinic_name: z.string().min(1, t('clinics.nameRequired')),
    address: z.string().min(1, t('clinics.addressRequired')),
    phone: z.string().min(1, t('clinics.phoneRequired')),
  });

  type ClinicFormValues = z.infer<typeof clinicSchema>;

  const defaultFormValues: ClinicFormValues = {
    clinic_name: '',
    address: '',
    phone: '',
  };

  const [formInitialValues, setFormInitialValues] = useState<ClinicFormValues>(defaultFormValues);

  const {
    data: clinics = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['clinics', appliedSearch],
    queryFn: () =>
      appliedSearch.trim()
        ? doctorService.searchClinicsByName(appliedSearch.trim())
        : doctorService.getClinics(),
  });

  const invalidateClinics = () => qc.invalidateQueries({ queryKey: ['clinics'] });

  const createMut = useMutation({
    mutationFn: (d: ClinicForm) => doctorService.createClinic(d),
    onSuccess: () => {
      invalidateClinics();
      toast.success(t('clinics.clinicAdded'));
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message || t('common.error')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClinicForm }) =>
      doctorService.updateClinic(id, data),
    onSuccess: () => {
      invalidateClinics();
      toast.success(t('clinics.clinicUpdated'));
      closeForm();
    },
    onError: (err: Error) => toast.error(err.message || t('common.error')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => doctorService.deleteClinic(id),
    onSuccess: () => {
      invalidateClinics();
      toast.success(t('clinics.clinicDeleted'));
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || t('common.error')),
  });

  const toFormValues = (clinic: Clinic): ClinicFormValues => ({
    clinic_name: clinic.clinic_name,
    address: clinic.address,
    phone: clinic.phone,
  });

  const openAddForm = () => {
    setEditClinic(null);
    setFormInitialValues(defaultFormValues);
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const openEditForm = (clinic: Clinic) => {
    setEditClinic(clinic);
    setFormInitialValues(toFormValues(clinic));
    setFormKey((k) => k + 1);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditClinic(null);
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

  const handleSubmit = (values: ClinicFormValues) => {
    if (editClinic) {
      updateMut.mutate({ id: editClinic.clinic_id, data: values });
    } else {
      createMut.mutate(values);
    }
  };

  const isSubmitting = createMut.isPending || updateMut.isPending;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('clinics.title')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('clinics.subtitle')}
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5 self-start"
        >
          <Plus size={16} /> {t('clinics.newClinic')}
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {t('clinics.searchByName')}
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
              placeholder={t('clinics.searchPlaceholder')}
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
              ? t('clinics.searchResults', { count: clinics.length, query: appliedSearch })
              : t('clinics.totalClinics', { count: clinics.length })}
          </p>
        )}
      </div>

      {isError && (
        <div className="glass-card p-4 border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-500">
            {(error as Error)?.message || t('clinics.loadError')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-48 animate-pulse bg-slate-500/5" />
          ))}

        {!isLoading && clinics.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center">
            <p style={{ color: 'var(--text-muted)' }}>
              {appliedSearch ? t('clinics.noSearchResults') : t('clinics.noClinics')}
            </p>
          </div>
        )}

        {!isLoading &&
          clinics.map((clinic) => (
            <motion.div
              key={clinic.clinic_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group glass-card p-6 border-b-4 border-indigo-500 hover:shadow-xl transition-all relative"
            >
              <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => openEditForm(clinic)}
                  className="p-1.5 rounded-lg hover:bg-amber-500/10"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={t('common.edit')}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(clinic)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {clinic.clinic_name}
              </h3>

              <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <MapPin size={14} className="text-indigo-500 flex-shrink-0" />
                  {clinic.address}
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Phone size={14} className="text-indigo-500 flex-shrink-0" />
                  {clinic.phone}
                </div>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Calendar size={14} className="text-indigo-500 flex-shrink-0" />
                  {formatDate(clinic.created_at)}
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editClinic ? t('clinics.editTitle') : t('clinics.addTitle')}
        size="md"
      >
        <AppForm<ClinicFormValues>
          formKey={formKey}
          initialValues={formInitialValues}
          validate={zodValidator(clinicSchema)}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <FormField name="clinic_name" label={t('clinics.clinicName')} required />
          <FormField name="address" label={t('clinics.location')} required />
          <FormField name="phone" label={t('clinics.phone')} type="tel" required />
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-60"
            >
              {isSubmitting
                ? t('common.saving')
                : editClinic
                  ? t('common.save')
                  : t('clinics.addClinic')}
            </button>
          </div>
        </AppForm>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.clinic_id)}
        title={t('common.delete')}
        message={t('clinics.deleteConfirm', { name: deleteTarget?.clinic_name ?? '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </motion.div>
  );
}
