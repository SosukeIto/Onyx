import { IconBase, type IconProps } from "./base";

export function IconTemplate(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" strokeDasharray="3.4 3" />
      <path d="M8.4 9.6h7.2M8.4 14.2h4.2" />
    </IconBase>
  );
}
