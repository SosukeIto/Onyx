import { IconBase, type IconProps } from "./base";

export function IconGit(props: IconProps) {
	return (
		<IconBase {...props}>
			<circle cx="6.6" cy="6.4" r="2.6" />
			<circle cx="6.6" cy="17.6" r="2.6" />
			<circle cx="17.4" cy="12" r="2.6" />
			<path d="M6.6 9v6" />
			<path d="M9.2 6.9c4.4.5 5.5 2.3 5.6 3.1" />
		</IconBase>
	);
}
