import { NavLink } from 'react-router-dom'
import { getToneClass, type ToneName } from '../toneClasses'
import { DecorativeIcon, type DecorativeIconProps } from './DecorativeIcon'

const iconClass = 'w-5 h-5 shrink-0'

type ActionButtonProps = {
  icon: DecorativeIconProps['icon']
  label: string
  tone: ToneName
  to: string
}
const ActionButton = ({ icon, label, tone, to }: ActionButtonProps) => (
  <NavLink
    to={to}
    className={getToneClass(
      tone,
      'flex w-full items-center justify-center rounded-lg px-4 py-3 text-base font-medium sm:w-auto sm:py-2 sm:text-sm',
    )}
  >
    <span>
      <DecorativeIcon icon={icon} className={iconClass} />
    </span>
    <span>{label}</span>
  </NavLink>
)

export default ActionButton
