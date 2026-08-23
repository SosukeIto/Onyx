import { IconBase, type IconProps } from "./base";

export function IconNewNote(props: IconProps) {
	return (
		<IconBase {...props}>
			<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
			<path d="M17 3.5v6M14 6.5h6" />
		</IconBase>
	);
}
