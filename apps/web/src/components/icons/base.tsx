import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** width / height in px. Rail 22 / header 20 / panel 16 / tree 15 / meta 14. */
  size?: number | string;
}

/**
 * Shared frame for every Onyx icon: 24 grid, no fill, currentColor stroke.
 * Icons are decorative by default; pass `aria-hidden={false}` + `role="img"` +
 * `aria-label` when the icon itself carries the meaning.
 */
export function IconBase({
  size = 20,
  strokeWidth = 1.75,
  className,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}
