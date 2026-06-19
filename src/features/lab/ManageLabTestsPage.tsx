import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useLabTests, useCreateLabTest, useUpdateLabTest, useDeleteLabTest } from '../../hooks/useLabTests';
import type { LabTest } from '../../types';

const labTestSchema = z.object({
  test_name: z.string().min(1, 'Test name is required'),
  category: z.string().min(1, 'Category is required'),
  units: z.string().min(1, 'Units are required'),
  normal_range: z.string().min(1, 'Normal range is required'),
  description: z.string().optional(),
});

type LabTestForm = z.infer<typeof labTestSchema>;

type FieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

function FormField({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const defaultValues: LabTestForm = {
  test_name: '',
  category: '',
  units: '',
  normal_range: '',
  description: '',
};

export default function ManageLabTestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const labTestsQuery = useLabTests();
  const createMutation = useCreateLabTest();
  const updateMutation = useUpdateLabTest();
  const deleteMutation = useDeleteLabTest();

  const { register, handleSubmit, reset, formState } = useForm<LabTestForm>({
    resolver: zodResolver(labTestSchema),
    defaultValues,
  });

  useEffect(() => {
    if (selectedTest) {
      reset({
        test_name: selectedTest.test_name,
        category: selectedTest.category,
        units: selectedTest.units,
        normal_range: selectedTest.normal_range,
        description: selectedTest.description,
      });
    } else {
      reset(defaultValues);
    }
  }, [selectedTest, reset]);

  const openCreateForm = () => {
    setSelectedTest(null);
    reset(defaultValues);
    setIsOpen(true);
  };

  const openEditForm = (test: LabTest) => {
    setSelectedTest(test);
    setIsOpen(true);
  };

  const closeForm = () => {
    setSelectedTest(null);
    setIsOpen(false);
    reset(defaultValues);
  };

  const onSubmit = async (values: LabTestForm) => {
    const payload = {
      ...values,
      description: values.description ?? '',
    };

    if (selectedTest) {
      await updateMutation.mutateAsync({ id: selectedTest.lab_test_id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    closeForm();
  };

  const handleDelete = async (test: LabTest) => {
    if (!window.confirm('Are you sure you want to delete this lab test?')) {
      return;
    }
    await deleteMutation.mutateAsync(test.lab_test_id);
  };

  const columns: Column<LabTest>[] = [
    { key: 'test_name', header: t('lab.testName') || 'Test name' },
    { key: 'category', header: t('common.category') || 'Category' },
    { key: 'units', header: t('lab.units') || 'Units' },
    { key: 'normal_range', header: t('lab.normalRange') || 'Normal range' },
    {
      key: 'description',
      header: t('common.description') || 'Description',
      render: (value) => <span className="truncate block max-w-xl">{String(value)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions') || 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={() => openEditForm(row)}
          >
            <Edit3 size={14} className="inline-block mr-1" />
            {t('common.edit') || 'Edit'}
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-600 transition hover:bg-red-100"
            onClick={() => handleDelete(row)}
          >
            <Trash2 size={14} className="inline-block mr-1" />
            {t('common.delete') || 'Delete'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('lab.manageTests') || 'Manage Lab Tests'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('lab.manageTestsDescription') || 'Create and update lab test definitions.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('common.back') || 'Back'}
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> {t('lab.addTest') || 'Add test'}
          </button>
        </div>
      </div>

      <DataTable<LabTest>
        columns={columns}
        data={labTestsQuery.data ?? []}
        isLoading={labTestsQuery.isLoading}
        searchPlaceholder={t('lab.searchPlaceholder') || 'Search tests'}
        emptyMessage={t('lab.noTests') || 'No lab tests found'}
      />

      <Modal isOpen={isOpen} onClose={closeForm} title={selectedTest ? t('lab.editTest') || 'Edit lab test' : t('lab.addTest') || 'Add lab test'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('lab.testName') || 'Test name'} error={formState.errors.test_name?.message?.toString()}>
              <input
                {...register('test_name')}
                className="input-field w-full"
                placeholder={t('lab.testNamePlaceholder') || 'e.g. Complete Blood Count'}
              />
            </FormField>
            <FormField label={t('common.category') || 'Category'} error={formState.errors.category?.message?.toString()}>
              <input
                {...register('category')}
                className="input-field w-full"
                placeholder={t('lab.categoryPlaceholder') || 'e.g. Hematology'}
              />
            </FormField>
            <FormField label={t('lab.units') || 'Units'} error={formState.errors.units?.message?.toString()}>
              <input
                {...register('units')}
                className="input-field w-full"
                placeholder={t('lab.unitsPlaceholder') || 'e.g. cells/mcL'}
              />
            </FormField>
            <FormField label={t('lab.normalRange') || 'Normal range'} error={formState.errors.normal_range?.message?.toString()}>
              <input
                {...register('normal_range')}
                className="input-field w-full"
                placeholder={t('lab.normalRangePlaceholder') || 'e.g. 4.5 - 11.0'}
              />
            </FormField>
          </div>

          <FormField label={t('common.description') || 'Description'} error={formState.errors.description?.message?.toString()}>
            <textarea
              {...register('description')}
              className="input-field w-full min-h-[120px]"
              placeholder={t('lab.descriptionPlaceholder') || 'Optional description'}
            />
          </FormField>

          <div className="flex items-center justify-between gap-3 pt-4">
            {selectedTest && (
              <button
                type="button"
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600 transition hover:bg-red-100"
                onClick={() => selectedTest && handleDelete(selectedTest)}
                disabled={deleteMutation.isPending}
              >
                {t('common.delete') || 'Delete'}
              </button>
            )}
            <button
              type="submit"
              className="gradient-btn px-6 py-2.5 text-sm"
              disabled={formState.isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {selectedTest ? t('common.update') || 'Update test' : t('common.save') || 'Save test'}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
