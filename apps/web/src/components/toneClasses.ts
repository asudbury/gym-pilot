export type ToneName =
  | 'default'
  | 'white'
  | 'emerald'
  | 'orange'
  | 'rose'
  | 'blue'
  | 'destructive'
  | 'chip'
  | 'chip-rose'
  | 'chip-blue'
  | 'chip-destructive'

const toneClasses: Record<ToneName, string> = {
  default:
    'cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-base font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-white hover:font-semibold hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700',
  white:
    'cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800',
  emerald:
    'cursor-pointer rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-base font-medium text-emerald-700 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-100 hover:font-semibold hover:shadow-md dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:border-emerald-600 dark:hover:bg-emerald-800',
  orange:
    'cursor-pointer rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-base font-medium text-orange-700 transition-all duration-200 hover:border-orange-400 hover:bg-orange-100 hover:font-semibold hover:shadow-md dark:border-orange-700 dark:bg-orange-900 dark:text-orange-100 dark:hover:border-orange-600 dark:hover:bg-orange-800',
  rose: 'cursor-pointer rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-base font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-md dark:border-rose-700 dark:bg-rose-900 dark:text-rose-100 dark:hover:border-rose-600 dark:hover:bg-rose-800 dark:hover:text-rose-200',
  destructive:
    'cursor-pointer rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-base font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-md dark:border-rose-700 dark:bg-slate-900 dark:text-rose-500 dark:hover:border-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-300',
  blue: 'cursor-pointer rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-base font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 hover:font-semibold hover:shadow-md dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100 dark:hover:border-blue-600 dark:hover:bg-blue-800',

  // Small "chip" variants for inline controls
  chip: 'cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700',
  'chip-rose':
    'cursor-pointer rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-sm dark:border-rose-700 dark:bg-rose-900 dark:text-rose-100 dark:hover:border-rose-600 dark:hover:bg-rose-800',
  'chip-blue':
    'cursor-pointer rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 hover:font-semibold hover:shadow-sm dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100 dark:hover:border-blue-600 dark:hover:bg-blue-800',
  'chip-destructive':
    'cursor-pointer rounded-lg border border-rose-600 bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-rose-700 hover:bg-rose-700 hover:font-semibold',
}

export function getToneClass(tone: ToneName, className?: string) {
  return [toneClasses[tone], className].filter(Boolean).join(' ')
}
