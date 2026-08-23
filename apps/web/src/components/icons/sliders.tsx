import { IconBase, type IconProps } from "./base";

export function IconSliders(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M4 8h9.5M18.5 8H20M4 16h3.5M12.5 16H20" />
			<circle cx="16" cy="8" r="2.4" />
			<circle cx="10" cy="16" r="2.4" />
		</IconBase>
	);
}
