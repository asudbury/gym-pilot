import clsx from 'clsx';

type StatusTone = 'default' | 'error' | 'success' | 'info';

interface StatusMessageProps {
  message: string | null;
  tone?: StatusTone;
  className?: string;
}

export function StatusMessage({ message, tone = 'default', className }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  const toneClasses = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    default: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <div className={clsx('mt-4 rounded-2xl border px-4 py-3 text-sm', toneClasses[tone], className)}>
      {message}
    </div>
  );
}