import { IconBase, type IconProps } from "./base";

export function IconLink(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M10.4 13.6a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1.6 1.6" />
			<path d="M13.6 10.4a3.6 3.6 0 0 0-5.1 0l-3 3a3.6 3.6 0 0 0 5.1 5.1l1.6-1.6" />
		</IconBase>
	);
}
