import { IconBase, type IconProps } from "./base";

export function IconGraph(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="6" cy="17.2" r="2.6" />
			<circle cx="18" cy="17.2" r="2.6" />
			<circle cx="12" cy="5.8" r="2.8" />
			<path d="m10.7 8.3-3.1 6.4M13.3 8.3l3.1 6.4M8.6 17.2h6.8" />
		</IconBase>
	);
}
