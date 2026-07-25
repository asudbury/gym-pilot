export type DecorativeIconProps = {
  icon?:
    | 'back'
    | 'calendar'
    | 'chart'
    | 'check'
    | 'clipboard'
    | 'close'
    | 'database'
    | 'document'
    | 'dumbbell'
    | 'edit'
    | 'grid'
    | 'heart'
    | 'help'
    | 'home'
    | 'key'
    | 'lock'
    | 'preferences'
    | 'search'
    | 'settings'
    | 'share'
    | 'shield'
    | 'spark'
    | 'star'
    | 'tasks'
    | 'trash'
    | 'user'
    | 'users'
    | null
  className?: string
  withContainer?: boolean
}

import {
  ShareIcon,
  SparkIcon,
  DumbbellIcon,
  SearchIcon,
  StarIcon,
  ChartIcon,
  GridIcon,
  HeartIcon,
  ClipboardIcon,
  ShieldIcon,
  BackIcon,
  CalendarIcon,
  HelpIcon,
  HomeIcon,
  TasksIcon,
  UsersIcon,
  DatabaseIcon,
  SettingsIcon,
  KeyIcon,
  UserIcon,
  PreferencesIcon,
  LockIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  CloseIcon,
  DocumentIcon,
} from './icons'

const baseClasses =
  'flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'

const iconComponents = {
  back: BackIcon,
  calendar: CalendarIcon,
  chart: ChartIcon,
  check: CheckIcon,
  clipboard: ClipboardIcon,
  close: CloseIcon,
  database: DatabaseIcon,
  document: DocumentIcon,
  dumbbell: DumbbellIcon,
  edit: EditIcon,
  grid: GridIcon,
  heart: HeartIcon,
  help: HelpIcon,
  home: HomeIcon,
  key: KeyIcon,
  lock: LockIcon,
  preferences: PreferencesIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  share: ShareIcon,
  shield: ShieldIcon,
  spark: SparkIcon,
  star: StarIcon,
  tasks: TasksIcon,
  trash: TrashIcon,
  user: UserIcon,
  users: UsersIcon,
}

const DecorativeIcon = ({
  icon = 'spark',
  className = '',
  withContainer = false,
}: DecorativeIconProps) => {
  if (icon === null) {
    return null
  }

  const iconClassName = className || 'h-5 w-5'
  const containerClassName = withContainer
    ? `${baseClasses} ${className}`.trim()
    : className

  const IconComponent = iconComponents[icon]

  return (
    <div className={containerClassName} aria-hidden="true">
      {IconComponent && <IconComponent className={iconClassName} />}
    </div>
  )
}

export { DecorativeIcon }
