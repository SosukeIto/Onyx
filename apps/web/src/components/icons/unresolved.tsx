import { IconBase, type IconProps } from "./base";

export function IconUnresolved(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="7.6" strokeDasharray="3.2 3" />
		</IconBase>
	);
}
