import { IconBase, type IconProps } from "./base";

export function IconCase(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M2.8 18 7.4 6.6 12 18M4.4 14.4h6" />
			<circle cx="17.4" cy="14.4" r="3.4" />
			<path d="M20.8 11v7" />
		</IconBase>
	);
}
