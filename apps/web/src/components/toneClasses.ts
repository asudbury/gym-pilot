export type ToneName = 'default' | 'white' | 'emerald' | 'orange' | 'rose' | 'blue'

export const toneClasses: Record<ToneName, string> = {
  default: 'cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 transition-colors dark:bg-slate-800 dark:text-slate-100',
  white: 'cursor-pointer rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 transition-colors dark:bg-slate-900 dark:text-slate-100',
  emerald: 'cursor-pointer rounded-full bg-emerald-600 px-3 py-1 text-sm font-medium text-white',
  orange: 'cursor-pointer rounded-full bg-orange-600 px-3 py-1 text-sm font-medium text-white',
  rose: 'cursor-pointer rounded-full bg-rose-600 px-3 py-1 text-sm font-medium text-white',
  blue: 'cursor-pointer rounded-full bg-blue-700 px-3 py-1 text-sm font-medium text-white'
}

export function getToneClass(tone: ToneName, className?: string) {
  return [toneClasses[tone], className].filter(Boolean).join(' ')
}
