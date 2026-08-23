import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/** Run git in `cwd` and return stdout. Throws with stderr on a non-zero exit. */
export async function git(args: string[], cwd: string): Promise<string> {
	const proc = Bun.spawn(["git", ...args], {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
		env: {
			...process.env,
			// Never block on credential prompts inside a server process.
			GIT_TERMINAL_PROMPT: "0",
			GIT_ASKPASS: "",
		},
	});

	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	]);

	if (exitCode !== 0) {
		throw new Error(
			`git ${args.join(" ")} failed (exit ${exitCode}): ${stderr.trim() || stdout.trim()}`,
		);
	}

	return stdout;
}

export interface EnsureCloneOptions {
	url: string;
	branch: string;
	/** Absolute path of the clone target. */
	dir: string;
}

/**
 * Clone the vault when `dir` does not contain a git repository yet.
 * Returns `true` when a clone was performed, `false` when it already existed.
 */
export async function ensureClone({
	url,
	branch,
	dir,
}: EnsureCloneOptions): Promise<boolean> {
	if (existsSync(path.join(dir, ".git"))) {
		return false;
	}

	const parent = path.dirname(dir);
	await mkdir(parent, { recursive: true });
	// Full history (the vault is ~15 MB) so that per-file last-modified dates
	// from `git log` are accurate instead of collapsing onto the tip commit.
	await git(["clone", "--branch", branch, url, dir], parent);
	return true;
}

/**
 * Bring the clone to the tip of `origin/<branch>`. The working tree is assumed
 * to be read-only, so local changes are discarded.
 */
export async function fetchAndReset(
	dir: string,
	branch: string,
): Promise<void> {
	// The explicit refspec keeps refs/remotes/origin/<branch> in sync even for
	// clones created with `--branch`. `--unshallow` is a no-op on full clones
	// but upgrades clones made by older versions of this module.
	const shallow = existsSync(path.join(dir, ".git", "shallow"));
	await git(
		[
			"fetch",
			...(shallow ? ["--unshallow"] : []),
			"origin",
			`+${branch}:refs/remotes/origin/${branch}`,
		],
		dir,
	);
	await git(["reset", "--hard", `origin/${branch}`], dir);
}

/** Current HEAD commit hash of the clone. */
export async function headCommit(dir: string): Promise<string> {
	return (await git(["rev-parse", "HEAD"], dir)).trim();
}

/**
 * Last commit date (ISO 8601) per vault-relative path.
 *
 * Files never touched by any visible commit are omitted and end up with
 * `modified: null` in the index.
 */
export async function fileDates(dir: string): Promise<Map<string, string>> {
	const stdout = await git(
		[
			// Keep non-ASCII paths (the vault is mostly Japanese) unescaped.
			"-c",
			"core.quotePath=false",
			"log",
			"--format=%H%x00%cI",
			"--name-only",
			"--diff-filter=ACMR",
		],
		dir,
	);

	const dates = new Map<string, string>();
	let current: string | null = null;

	for (const line of stdout.split("\n")) {
		if (line === "") continue;

		const nul = line.indexOf("\0");
		if (nul !== -1) {
			current = line.slice(nul + 1).trim();
			continue;
		}

		// `git log` is newest-first, so the first entry wins.
		if (current !== null && !dates.has(line)) {
			dates.set(line, current);
		}
	}

	return dates;
}
