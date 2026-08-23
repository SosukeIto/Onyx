import { IconBase, type IconProps } from "./base";

export function IconSearch(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="11" cy="11" r="7" />
			<path d="m20 20-3.6-3.6" />
		</IconBase>
	);
}
