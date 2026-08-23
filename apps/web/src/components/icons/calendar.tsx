import { IconBase, type IconProps } from "./base";

export function IconCalendar(props: IconProps) {
	return (
		<IconBase {...props}>
			<rect x="3" y="5" width="18" height="16" rx="2.5" />
			<path d="M8 3v4M16 3v4M3 10h18" />
		</IconBase>
	);
}
