import { IconBase, type IconProps } from "./base";

export function IconDistance(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="4.8" cy="12" r="2.2" />
      <circle cx="19.2" cy="12" r="2.2" />
      <path d="M8 12h8M11 9.6 8.6 12 11 14.4M13 9.6l2.4 2.4-2.4 2.4" />
    </IconBase>
  );
}
