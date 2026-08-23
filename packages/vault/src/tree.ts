import type { Note, TreeFolder, TreeNode } from "./types";

const collator = new Intl.Collator("ja", {
	numeric: true,
	sensitivity: "variant",
});

function compareNodes(a: TreeNode, b: TreeNode): number {
	if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
	return collator.compare(a.name, b.name);
}

/**
 * Build the folder tree of the vault. Only notes are listed; attachments are
 * reachable through the notes that embed them.
 */
export function buildTree(notes: Map<string, Note>): TreeFolder {
	const root: TreeFolder = {
		kind: "folder",
		name: "",
		path: "",
		children: [],
		noteCount: 0,
	};
	const folders = new Map<string, TreeFolder>([["", root]]);

	const ensureFolder = (path: string): TreeFolder => {
		const existing = folders.get(path);
		if (existing) return existing;
		const slash = path.lastIndexOf("/");
		const parentPath = slash === -1 ? "" : path.slice(0, slash);
		const name = slash === -1 ? path : path.slice(slash + 1);
		const folder: TreeFolder = {
			kind: "folder",
			name,
			path,
			children: [],
			noteCount: 0,
		};
		folders.set(path, folder);
		ensureFolder(parentPath).children.push(folder);
		return folder;
	};

	for (const note of notes.values()) {
		const parent = ensureFolder(note.folder);
		parent.children.push({
			kind: "file",
			name: `${note.basename}.md`,
			path: note.path,
			title: note.title,
		});
		let current: string | null = note.folder;
		while (current !== null) {
			const folder = folders.get(current);
			if (folder) folder.noteCount++;
			if (current === "") break;
			const slash: number = current.lastIndexOf("/");
			current = slash === -1 ? "" : current.slice(0, slash);
		}
	}

	for (const folder of folders.values()) folder.children.sort(compareNodes);
	return root;
}
