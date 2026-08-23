import { IconBase, type IconProps } from "./base";

export function IconEdge(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="6" cy="18" r="2.6" />
			<circle cx="18" cy="6" r="2.6" />
			<path d="m7.9 16.1 8.2-8.2" />
		</IconBase>
	);
}
