import { useTranslation } from 'react-i18next';
import { cn, getStatusColor } from '../../lib/utils';

export function StatusBadge({ status, isTranslated }: { status: string; isTranslated?: boolean }) {
  const { t } = useTranslation();

  // Try to find status translation in common.status, otherwise fallback to capitalized string
  const label = t(`patients.status.${status}`);

  return (
    <span className={cn('status-badge uppercase text-[10px] font-bold tracking-wider', getStatusColor(status))}>
      {isTranslated ? status : label}
    </span>
  );
}
