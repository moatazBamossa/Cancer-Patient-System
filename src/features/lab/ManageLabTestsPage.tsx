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
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useLabTests, useCreateLabTest, useUpdateLabTest, useDeleteLabTest } from '../../hooks/useLabTests';
import type { LabTest } from '../../types';

const labTestSchema = (t: ReturnType<typeof useTranslation>['t']) => z.object({
  test_name: z.string().min(1, t('lab.testNameRequired')),
  category: z.string().min(1, t('lab.categoryRequired')),
  units: z.string().min(1, t('lab.unitsRequired')),
  normal_range: z.string().min(1, t('lab.normalRangeRequired')),
  description: z.string().optional(),
});

type LabTestForm = z.infer<ReturnType<typeof labTestSchema>>;

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    testId: string;
  }>({ isOpen: false, testId: '' });

  const labTestsQuery = useLabTests();
  const createMutation = useCreateLabTest();
  const updateMutation = useUpdateLabTest();
  const deleteMutation = useDeleteLabTest();

  const { register, handleSubmit, reset, formState } = useForm<LabTestForm>({
    resolver: zodResolver(labTestSchema(t)),
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

  const handleDelete = async (testId: string) => {
    await deleteMutation.mutateAsync(testId);
  };

  const columns: Column<LabTest>[] = [
    { key: 'test_name', header: t('lab.testName') },
    { key: 'category', header: t('common.category') },
    { key: 'units', header: t('lab.units') },
    { key: 'normal_range', header: t('lab.normalRange') },
    {
      key: 'description',
      header: t('common.description'),
      render: (value) => <span className="truncate block max-w-xl">{String(value)}</span>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={() => openEditForm(row)}
          >
            <Edit3 size={14} className="inline-block mr-1" />
            {t('common.edit')}
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-600 transition hover:bg-red-100"
            onClick={() =>
              setShowDeleteConfirm({
                isOpen: true,
                testId: String(row.lab_test_id),
              })
            }
          >
            <Trash2 size={14} className="inline-block mr-1" />
            {t('common.delete')}
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
            {t('lab.manageTests')}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('lab.manageTestsDescription')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('common.back')}
          </button>
          <button
            type="button"
            onClick={openCreateForm}
            className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> {t('lab.addTest')}
          </button>
        </div>
      </div>

      <DataTable<LabTest>
        columns={columns}
        data={labTestsQuery.data ?? []}
        isLoading={labTestsQuery.isLoading}
        searchPlaceholder={t('lab.searchPlaceholder')}
        emptyMessage={t('lab.noTests')}
      />

      <Modal isOpen={isOpen} onClose={closeForm} title={selectedTest ? t('lab.editTest') : t('lab.addTest')} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('lab.testName')} error={formState.errors.test_name?.message?.toString()}>
              <input
                {...register('test_name')}
                className="input-field w-full"
                placeholder={t('lab.testNamePlaceholder')}
              />
            </FormField>
            <FormField label={t('common.category')} error={formState.errors.category?.message?.toString()}>
              <input
                {...register('category')}
                className="input-field w-full"
                placeholder={t('lab.categoryPlaceholder')}
              />
            </FormField>
            <FormField label={t('lab.units')} error={formState.errors.units?.message?.toString()}>
              <input
                {...register('units')}
                className="input-field w-full"
                placeholder={t('lab.unitsPlaceholder')}
              />
            </FormField>
            <FormField label={t('lab.normalRange')} error={formState.errors.normal_range?.message?.toString()}>
              <input
                {...register('normal_range')}
                className="input-field w-full"
                placeholder={t('lab.normalRangePlaceholder')}
              />
            </FormField>
          </div>

          <FormField label={t('common.description')} error={formState.errors.description?.message?.toString()}>
            <textarea
              {...register('description')}
              className="input-field w-full min-h-[120px]"
              placeholder={t('lab.descriptionPlaceholder')}
            />
          </FormField>

          <div className="flex items-center justify-between gap-3 pt-4">
            {selectedTest && (
              <button
                type="button"
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600 transition hover:bg-red-100"
                onClick={() => {
                  if (selectedTest) {
                    setShowDeleteConfirm({
                      isOpen: true,
                      testId: String(selectedTest.lab_test_id),
                    })
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {t('common.delete')}
              </button>
            )}
            <button
              type="submit"
              className="gradient-btn px-6 py-2.5 text-sm"
              disabled={formState.isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              {selectedTest ? t('common.update') : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        onClose={() =>
          setShowDeleteConfirm({ isOpen: false, testId: '' })
        }
        onConfirm={() => {
          if (showDeleteConfirm.testId) {
            handleDelete(showDeleteConfirm.testId)
          }
        }}
        title={t("common.delete")}
        message={t("lab.deleteTestConfirm")}
        variant="danger"
      />
    </motion.div>
  );
}
