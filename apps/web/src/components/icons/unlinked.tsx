import { IconBase, type IconProps } from "./base";

export function IconUnlinked(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m10.3 13.7-1.7 1.7a3.6 3.6 0 0 1-5.1-5.1l1.7-1.7" />
      <path d="m13.7 10.3 1.7-1.7a3.6 3.6 0 0 1 5.1 5.1l-1.7 1.7" />
      <path d="M9.6 12h1.2M13.2 12h1.2" />
    </IconBase>
  );
}
