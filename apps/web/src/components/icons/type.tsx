import { IconBase, type IconProps } from "./base";

export function IconType(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M5 7V5h14v2M12 5v14M9 19h6" />
		</IconBase>
	);
}
