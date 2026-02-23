import { cn, getStatusColor } from '../../lib/utils';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('status-badge', getStatusColor(status))}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
