import { IconBase, type IconProps } from "./base";

export function IconKey(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="15.4" r="3.6" />
      <path d="m10.6 12.8 8-8M15.8 7.6l2 2M13.2 10.2l2 2" />
    </IconBase>
  );
}
