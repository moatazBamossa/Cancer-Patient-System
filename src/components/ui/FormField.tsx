import React from 'react';
import { Field } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { getFieldError } from '../../lib/formUtils';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'textarea' | 'select' | 'datetime-local';
  // component allows callers to explicitly choose the rendered element
  component?: 'input' | 'textarea' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  component,
  placeholder,
  options,
  required,
  disabled,
  className,
}: FormFieldProps) {
  const { t } = useTranslation();
  return (
    <Field
      name={name}
      type={type}
      parse={
        type === 'number'
          ? (value) => (value === '' || value == null ? undefined : Number(value))
          : (type === 'select' || component === 'select')
          ? (value) => {
              if (value === '' || value == null) return undefined;
              if (value === 'true') return true;
              if (value === 'false') return false;
              const num = Number(value);
              return Number.isNaN(num) ? value : num;
            }
          : undefined
      }
    >
      {({ input, meta }) => {
        const errorMessage = getFieldError(meta);
        const inputClasses = cn(
          'input-field',
          errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
          className
        );

        return (
          <div className="space-y-1.5">
            <label
              htmlFor={name}
              className="block text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {(component === 'textarea' || type === 'textarea') ? (
              <textarea
                {...input}
                id={name}
                placeholder={placeholder}
                disabled={disabled}
                rows={3}
                className={inputClasses}
              />
            ) : (component === 'select' || type === 'select') ? (
              <select {...input} id={name} disabled={disabled} className={inputClasses}>
                <option value="">{placeholder || t('common.select')}</option>
                {options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...input}
                id={name}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className={inputClasses}
              />
            )}

            {errorMessage && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                {errorMessage}
              </p>
            )}
          </div>
        );
      }}
    </Field>
  );
}

interface FormSelectFieldProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormSelectField({
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
}: FormSelectFieldProps) {
  const { t } = useTranslation();
  return (
    <Field name={name}>
      {({ input, meta }) => {
        const errorMessage = getFieldError(meta);

        return (
          <div className="space-y-1.5">
            <label
              htmlFor={name}
              className="block text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select
              {...input}
              id={name}
              disabled={disabled}
              className={cn('input-field', errorMessage && 'border-red-500')}
            >
              <option value="">{placeholder || t('common.select')}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
          </div>
        );
      }}
    </Field>
  );
}

interface NewTextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function NewTextField({
  name,
  label,
  placeholder,
  required,
  disabled,
  className,
}: NewTextFieldProps) {
  return (
    <Field name={name}>
      {({ input, meta }) => {
        const errorMessage = getFieldError(meta);

        return (
          <div className="space-y-1.5">
            <label
              htmlFor={name}
              className="block text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              {...input}
              id={name}
              type="text"
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'input-field',
                errorMessage && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
                className
              )}
            />
            {errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
          </div>
        );
      }}
    </Field>
  );
}
