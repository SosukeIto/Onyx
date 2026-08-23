import { IconBase, type IconProps } from "./base";

export function IconArrowLeft(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M19.5 12h-15" />
			<path d="m10.5 5.5-6.5 6.5 6.5 6.5" />
		</IconBase>
	);
}
