import { IconBase, type IconProps } from "./base";

export function IconMark(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M4 6.2h16M4 17.8h16" />
			<rect x="4" y="9.8" width="11.5" height="4.4" rx="1.3" />
		</IconBase>
	);
}
