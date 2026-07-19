export type ToneName =
  'default' | 'white' | 'emerald' | 'orange' | 'rose' | 'blue' | 'destructive'

export const toneClasses: Record<ToneName, string> = {
  default:
    'cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
  white:
    'cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
  emerald:
    'cursor-pointer rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700',
  orange:
    'cursor-pointer rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700',
  rose: 'cursor-pointer rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700',
  destructive:
    'cursor-pointer rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700',
  blue: 'cursor-pointer rounded-full border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700',
}

export function getToneClass(tone: ToneName, className?: string) {
  return [toneClasses[tone], className].filter(Boolean).join(' ')
}
