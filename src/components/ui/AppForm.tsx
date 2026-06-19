import React from 'react';
import { Form } from 'react-final-form';
import type { Config, FormApi, SubmissionErrors } from 'final-form';

type AppFormProps<FormValues extends object> = {
  initialValues?: Partial<FormValues>;
  validate?: Config<FormValues>['validate'];
  onSubmit: (
    values: FormValues,
    form: FormApi<FormValues>
  ) => SubmissionErrors | Promise<SubmissionErrors> | void;
  children: React.ReactNode;
  className?: string;
  formKey?: string | number;
};

export function AppForm<FormValues extends object>({
  initialValues,
  validate,
  onSubmit,
  children,
  className,
  formKey,
}: AppFormProps<FormValues>) {
  return (
    <Form<FormValues>
      key={formKey}
      initialValues={initialValues}
      validate={validate}
      onSubmit={onSubmit}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit} className={className} noValidate>
          {children}
        </form>
      )}
    />
  );
}
