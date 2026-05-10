import { useTranslation } from 'react-i18next';
import { cn, getStatusColor } from '../../lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  
  // Try to find status translation in common.status, otherwise fallback to capitalized string
  const label = t(`common.status.${status}`, { defaultValue: status.replace(/_/g, ' ') });

  return (
    <span className={cn('status-badge uppercase text-[10px] font-bold tracking-wider', getStatusColor(status))}>
      {label}
    </span>
  );
}
