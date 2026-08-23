import { IconBase, type IconProps } from "./base";

export function IconClose(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M6 6 18 18" />
			<path d="M18 6 6 18" />
		</IconBase>
	);
}
