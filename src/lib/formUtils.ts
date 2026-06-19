import type { FieldMetaState } from 'react-final-form';

export function getFieldError(meta: FieldMetaState<unknown>): string | undefined {
  if (!(meta.touched || meta.submitFailed)) return undefined;
  return typeof meta.error === 'string' ? meta.error : undefined;
}
