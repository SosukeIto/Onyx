import { IconBase, type IconProps } from "./base";

export function IconArrowRight(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M4.5 12h15" />
			<path d="m13.5 5.5 6.5 6.5-6.5 6.5" />
		</IconBase>
	);
}
