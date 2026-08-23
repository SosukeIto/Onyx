import { IconBase, type IconProps } from "./base";

export function IconMore(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="5.5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="18.5" cy="12" r="1.3" />
    </IconBase>
  );
}
