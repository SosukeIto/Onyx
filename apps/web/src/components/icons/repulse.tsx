import { IconBase, type IconProps } from "./base";

export function IconRepulse(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 9.2V4.2M12 14.8v5M9.2 12h-5M14.8 12h5" />
      <path d="m9.8 6.4 2.2-2.2 2.2 2.2M9.8 17.6l2.2 2.2 2.2-2.2M6.4 9.8 4.2 12l2.2 2.2M17.6 9.8 19.8 12l-2.2 2.2" />
    </IconBase>
  );
}
