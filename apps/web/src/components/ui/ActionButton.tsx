import type { ToneName } from "../toneClasses";
import { Button } from "./Button";
import { DecorativeIcon, type DecorativeIconProps } from "./DecorativeIcon";

const buttonClass = "w-full md:w-auto h-14 px-4";
const iconClass = "w-5 h-5 shrink-0";

type ActionButtonProps = {
  icon: DecorativeIconProps['icon'];
  label: string;
  tone: ToneName;
  onClick: () => void;
}
const ActionButton = ({ icon, label, tone, onClick }: ActionButtonProps) => (
  <Button
    className={buttonClass}
    tone={tone}
    onClick={onClick}
  >
    <span className="flex w-full items-center">
      <span className="flex w-8 justify-center shrink-0">
        <DecorativeIcon icon={icon} className={iconClass} />
      </span>

      <span className="ml-2">
        {label}
      </span>
    </span>
  </Button>
);

export default ActionButton;