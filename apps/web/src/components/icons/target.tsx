import { IconBase, type IconProps } from "./base";

export function IconTarget(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="7.4" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4" />
    </IconBase>
  );
}
