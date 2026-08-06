import { NavLink } from 'react-router-dom'
import { getToneClass, type ToneName } from '../toneClasses'
import { DesktopOnly, NotOnDesktop } from '../visibility/DeviceVisibility'
import { DecorativeIcon, type DecorativeIconProps } from './DecorativeIcon'

const iconClass = 'w-5 h-5 shrink-0 mr-2 sm:mr-1'

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
      'flex w-full items-center justify-center px-4 py-2 text-base font-medium sm:w-auto sm:py-2 sm:text-sm',
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
