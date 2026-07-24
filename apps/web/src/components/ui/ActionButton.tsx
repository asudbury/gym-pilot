import { NavLink } from 'react-router-dom'
import { getToneClass, type ToneName } from '../toneClasses'
import { DecorativeIcon, type DecorativeIconProps } from './DecorativeIcon'
import { DesktopOnly, NotOnDesktop } from '../visibility/DeviceVisibility'

const iconClass = 'w-5 h-5 shrink-0'

type ActionButtonProps = {
  icon: DecorativeIconProps['icon']
  label: string
  mobileLabel: string
  tone: ToneName
  to: string
}
const ActionButton = ({
  icon,
  label,
  mobileLabel,
  tone,
  to,
}: ActionButtonProps) => (
  <NavLink
    to={to}
    className={getToneClass(
      tone,
      'flex w-full items-center justify-center rounded-lg px-4 py-3 text-base font-medium sm:w-auto sm:py-2 sm:text-sm',
    )}
  >
    <DesktopOnly>
      <span>
        <DecorativeIcon icon={icon} className={iconClass} />
      </span>
    </DesktopOnly>

    <DesktopOnly>
      <span>{label}</span>
    </DesktopOnly>
    <NotOnDesktop>
      <span>{mobileLabel}</span>
    </NotOnDesktop>
  </NavLink>
)

export default ActionButton
