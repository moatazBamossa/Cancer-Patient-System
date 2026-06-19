import type { ValidationErrors } from 'final-form';
import type { z } from 'zod';

export function zodValidator<T extends z.ZodTypeAny>(schema: T) {
  return (values: z.infer<T>): ValidationErrors => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    const errors: ValidationErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (path && !errors[path]) {
        errors[path] = issue.message;
      }
    }
    return errors;
  };
}
