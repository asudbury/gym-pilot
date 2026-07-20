export type ToneName =
  'default' | 'white' | 'emerald' | 'orange' | 'rose' | 'blue' | 'destructive'

export const toneClasses: Record<ToneName, string> = {
  default:
    'cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-base font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-white hover:font-semibold hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
  white:
    'cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
  emerald:
    'cursor-pointer rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-base font-medium text-emerald-700 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-100 hover:font-semibold hover:shadow-md',
  orange:
    'cursor-pointer rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-base font-medium text-orange-700 transition-all duration-200 hover:border-orange-400 hover:bg-orange-100 hover:font-semibold hover:shadow-md',
  rose: 'cursor-pointer rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-base font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-md',
  destructive:
    'cursor-pointer rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-base font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-md',
  blue: 'cursor-pointer rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-base font-medium text-blue-700 transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 hover:font-semibold hover:shadow-md',
}

export function getToneClass(tone: ToneName, className?: string) {
  return [toneClasses[tone], className].filter(Boolean).join(' ')
}
