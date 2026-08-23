#!/usr/bin/env bun
/**
 * Build the static vault bundle into `apps/web/public`.
 *
 *   bun run build:vault
 *   bun run scripts/build-vault.ts --vault-dir=data/vault --out-dir=apps/web/public
 *
 * In CI the vault is already checked out (actions/checkout of my-vault into
 * `data/vault`); locally the script clones it on first run. The Workers
 * runtime never sees git — everything git knows (commit, per-file dates) is
 * baked into the manifest here.
 */
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
// Deep relative import on purpose: this script runs from the repo root before
// any workspace install is guaranteed, so it must not rely on the
// `@Onyx/vault` symlink existing in the root `node_modules`.
import { buildStaticBundle } from "../packages/vault/src/static/index.ts";

const REPO_ROOT = resolve(import.meta.dir, "..");
const VAULT_URL = "https://github.com/SosukeIto/my-vault.git";

const DEFAULTS = {
  vaultDir: "data/vault",
  outDir: "apps/web/public",
  branch: "main",
};

/** `--key=value` / `--key value`, plus bare positional `[vaultDir] [outDir]`. */
function parseArgs(argv: string[]): {
  flags: Map<string, string>;
  positional: string[];
} {
  const flags = new Map<string, string>();
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const body = arg.slice(2);
    const eq = body.indexOf("=");
    if (eq !== -1) {
      flags.set(body.slice(0, eq), body.slice(eq + 1));
      continue;
    }
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      flags.set(body, next);
      i++;
    } else {
      flags.set(body, "true");
    }
  }
  return { flags, positional };
}

function absolute(path: string): string {
  return isAbsolute(path) ? path : join(REPO_ROOT, path);
}

/** Run git in `cwd` and return stdout. Throws with stderr on a non-zero exit. */
async function git(args: string[], cwd: string): Promise<string> {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
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

/**
 * Clone the vault when `dir` is not a git repository yet. CI checks the vault
 * out itself, so this only ever fires on a fresh local checkout.
 */
async function ensureClone(dir: string, branch: string): Promise<boolean> {
  if (existsSync(join(dir, ".git"))) return false;
  const parent = dirname(dir);
  await mkdir(parent, { recursive: true });
  // Full history (the vault is ~15 MB) so that per-file last-modified dates
  // from `git log` are accurate instead of collapsing onto the tip commit.
  await git(["clone", "--branch", branch, VAULT_URL, dir], parent);
  return true;
}

/**
 * Last commit date (ISO 8601) per vault-relative path. Files never touched by
 * a visible commit are omitted and end up with `modified: null`.
 */
async function fileDates(dir: string): Promise<Map<string, string>> {
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
    if (current !== null && !dates.has(line)) dates.set(line, current);
  }
  return dates;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

async function main(): Promise<void> {
  const { flags, positional } = parseArgs(Bun.argv.slice(2));

  const vaultDir = absolute(
    flags.get("vault-dir") ?? positional[0] ?? process.env.VAULT_DIR ?? DEFAULTS.vaultDir,
  );
  const outDir = absolute(
    flags.get("out-dir") ?? positional[1] ?? process.env.OUT_DIR ?? DEFAULTS.outDir,
  );
  const branch = flags.get("branch") ?? process.env.VAULT_BRANCH ?? DEFAULTS.branch;

  const started = Bun.nanoseconds();

  if (await ensureClone(vaultDir, branch)) {
    console.log(`cloned ${VAULT_URL} (${branch}) -> ${vaultDir}`);
  }

  const commit = (await git(["rev-parse", "HEAD"], vaultDir)).trim();
  const dates = await fileDates(vaultDir);

  const result = await buildStaticBundle({
    vaultDir,
    outDir,
    commit,
    branch,
    fileDates: dates,
  });

  const elapsed = (Bun.nanoseconds() - started) / 1e6;
  const { manifest } = result;

  console.log(`vault    ${vaultDir}`);
  console.log(`out      ${outDir}`);
  console.log(`commit   ${commit.slice(0, 12)} (${branch})`);
  console.log(`notes    ${result.noteCount}  attachments ${result.attachmentCount}`);
  console.log(
    `tags     ${manifest.tags.length}  unresolved ${manifest.unresolved.length}  daily ${manifest.daily.length}  logs ${manifest.logs.items.length}`,
  );
  console.log(
    `graph    ${manifest.graph.nodes.length} nodes / ${manifest.graph.edges.length} edges`,
  );
  console.log(`size     ${formatBytes(result.bytes)}`);
  console.log(`time     ${elapsed.toFixed(0)} ms`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
