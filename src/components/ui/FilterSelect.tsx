import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormSpy } from 'react-final-form';
import { AppForm } from './AppForm';
import { FormField } from './FormField';
import { cn } from '../../lib/utils';

export type FilterSelectProps = {
  options?: { label: string; value: string }[];
  initialValue?: string;
  onApply: (selectedValue: string) => void;
  onClose: () => void;
  placeholder?: string;
  className?: string;
};

export function FilterSelect({
  options,
  initialValue,
  onApply,
  onClose,
  placeholder,
  className
}: FilterSelectProps) {
  const { t } = useTranslation();

  const onSubmit = (values: { filterValue: string }) => {
    if (values.filterValue) {
      onApply(values.filterValue);
    }
    onClose();
  };

  return (
    <AppForm<{ filterValue: string }>
      initialValues={{ filterValue: initialValue || '' }}
      onSubmit={onSubmit}
      // className={cn('flex flex-col p-4 rounded-xl shadow-lg border w-64 bg-[var(--bg-secondary)] border-[var(--border-color)]', className)}
    >
      <FormField
        name="filterValue"
        type="select"
        label=""
        placeholder={placeholder || (t('common.select', { defaultValue: 'Select...' }) as string)}
        options={options}
      />


    </AppForm>
  );
}
