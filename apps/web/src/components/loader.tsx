import { IconSync } from "@/components/icons";

export default function Loader() {
	return (
		<div className="flex h-full items-center justify-center pt-8">
			<IconSync
				aria-label="読み込み中"
				aria-hidden={false}
				className="animate-spin text-ink-faint"
				role="img"
				size={22}
			/>
		</div>
	);
}
