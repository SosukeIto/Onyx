import { IconBase, type IconProps } from "./base";

export function IconQuestion(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="12" cy="12" r="8.6" />
			<path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.6" />
			<path d="M12 16.6h.01" />
		</IconBase>
	);
}
