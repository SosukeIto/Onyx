import { IconBase, type IconProps } from "./base";

export function IconOrphan(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="5.8" cy="12" r="2.8" />
			<circle cx="18.2" cy="12" r="2.8" />
			<path d="M9 12h1.6M13.4 12H15" />
		</IconBase>
	);
}
