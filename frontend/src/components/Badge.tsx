interface BadgeProps {
  variant?: string;
}

const styles: Record<string, string> = {
  approved: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-300',
  pending: 'bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300',
  awaiting: 'bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300',
  rejected: 'bg-rose-200 text-rose-900 dark:bg-rose-400/20 dark:text-rose-300',
  partial: 'bg-sky-200 text-sky-900 dark:bg-sky-400/20 dark:text-sky-300',
  none: 'bg-slate-300 text-slate-900 dark:bg-slate-600/40 dark:text-slate-300',
};

export default function Badge({ variant = 'none' }: BadgeProps) {
  const cls = styles[variant] || styles.none;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {variant.replace(/_/g, ' ')}
    </span>
  );
}


