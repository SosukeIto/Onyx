import { IconBase, type IconProps } from "./base";

export function IconNodeSize(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="7.4" cy="15.4" r="3" />
      <circle cx="16.4" cy="10.4" r="5.2" />
    </IconBase>
  );
}
