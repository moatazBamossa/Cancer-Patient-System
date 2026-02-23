import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'textarea' | 'select';
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
  placeholder,
  options,
  required,
  disabled,
  className,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

  const inputClasses = cn(
    'input-field',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/15',
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

      {type === 'textarea' ? (
        <textarea
          id={name}
          {...register(name)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className={inputClasses}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          {...register(name)}
          disabled={disabled}
          className={inputClasses}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          {...register(name, { valueAsNumber: type === 'number' })}
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
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const errorMessage = error?.message as string | undefined;

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
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <select
            {...field}
            id={name}
            disabled={disabled}
            className={cn(
              'input-field',
              error && 'border-red-500'
            )}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      />
      {errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
    </div>
  );
}
