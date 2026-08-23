import { IconBase, type IconProps } from "./base";

export function IconInfo(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11.2v5M12 7.8h.01" />
    </IconBase>
  );
}
