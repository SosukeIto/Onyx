import type { ButtonHTMLAttributes, Ref } from "react";

import { cx } from "@/lib/cx";

export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
	/** Required — icon buttons never carry visible text. Becomes `aria-label`. */
	label: string;
	size?: IconButtonSize;
	/** Renders the brand-tinted pressed state and sets `aria-pressed`. */
	active?: boolean;
	ref?: Ref<HTMLButtonElement>;
}

const SIZE: Record<IconButtonSize, string> = {
	sm: "size-[22px]",
	md: "size-[30px] max-sm:size-10",
	lg: "size-11 rounded-lg",
};

export function IconButton({
	label,
	size = "md",
	active,
	className,
	type = "button",
	...props
}: IconButtonProps) {
	return (
		<button
			aria-label={label}
			aria-pressed={active === undefined ? undefined : active}
			className={cx(
				"relative grid flex-none place-items-center rounded-md text-ink-muted transition-colors",
				"hover:bg-hover hover:text-ink",
				"disabled:pointer-events-none disabled:text-ink-faint disabled:opacity-40",
				active &&
					"bg-brand-soft text-brand hover:bg-brand-soft hover:text-brand",
				SIZE[size],
				className,
			)}
			type={type}
			{...props}
		/>
	);
}
