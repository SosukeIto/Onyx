import { IconBase, type IconProps } from "./base";

export function IconLogo(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 2.4 20.6 7v10L12 21.6 3.4 17V7z" />
      <path d="M3.4 7 12 11.6 20.6 7M12 11.6v10" />
    </IconBase>
  );
}
