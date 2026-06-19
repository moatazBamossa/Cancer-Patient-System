import { cn } from '../../lib/utils';

const planStatusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  completed: 'bg-blue-500/10 text-blue-600',
  cancelled: 'bg-red-500/10 text-red-600',
  draft: 'bg-slate-500/10 text-slate-600',
  ongoing: 'bg-emerald-500/10 text-emerald-600',
  'on-hold': 'bg-amber-500/10 text-amber-600',
};

const cycleStatusStyles: Record<string, string> = {
  scheduled: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  skipped: 'bg-slate-500/10 text-slate-600',
  delayed: 'bg-red-500/10 text-red-600',
};

export function PlanStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase',
        planStatusStyles[status] ?? 'bg-slate-500/10 text-slate-600'
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function CycleStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase',
        cycleStatusStyles[status] ?? 'bg-slate-500/10 text-slate-600'
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
