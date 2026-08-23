import { IconBase, type IconProps } from "./base";

export function IconPanelRight(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M14.5 4.5v15" />
    </IconBase>
  );
}
