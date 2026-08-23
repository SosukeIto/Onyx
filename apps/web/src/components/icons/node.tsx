import { IconBase, type IconProps } from "./base";

export function IconNode(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="5.2" />
    </IconBase>
  );
}
