import { IconBase, type IconProps } from "./base";

export function IconClock(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="8.6" />
			<path d="M12 7.2V12l3.2 2" />
		</IconBase>
	);
}
