import { beforeAll, describe, expect, test } from "vitest";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildStaticBundle } from "../static/build";
import { searchDocs } from "../static/client-search";
import type {
  BuildStaticBundleResult,
  SearchDoc,
  StaticNote,
  VaultManifest,
} from "../static/index";
import { assetId } from "../static/index";

const FIXTURE = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures", "synthetic");

let outDir: string;
let result: BuildStaticBundleResult;
let manifest: VaultManifest;
let docs: SearchDoc[];

async function readJson<T>(relative: string): Promise<T> {
  return JSON.parse(await readFile(join(outDir, relative), "utf8")) as T;
}

async function staticNote(path: string): Promise<StaticNote> {
  const id = manifest.notes[path]?.id;
  expect(id).toBeDefined();
  return readJson<StaticNote>(`vault/notes/${id}.json`);
}

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), "onyx-static-"));
  // A public file that is not part of the bundle: it must survive the build.
  await writeFile(join(outDir, "robots.txt"), "User-agent: *\n", "utf8");

  result = await buildStaticBundle({
    vaultDir: FIXTURE,
    outDir,
    commit: "deadbeef",
    branch: "main",
    fileDates: new Map([["Home.md", "2026-08-20T10:00:00+09:00"]]),
  });
  manifest = await readJson<VaultManifest>("vault/manifest.json");
  docs = await readJson<SearchDoc[]>("vault/search.json");
});

describe("buildStaticBundle", () => {
  test("writes a manifest that counts every note in the fixture", () => {
    expect(manifest.commit).toBe("deadbeef");
    expect(manifest.branch).toBe("main");
    expect(manifest.noteCount).toBe(result.noteCount);
    expect(Object.keys(manifest.notes)).toHaveLength(manifest.noteCount);
    expect(manifest.noteCount).toBe(8);
    expect(manifest.tree.noteCount).toBe(manifest.noteCount);
    expect(result.bytes).toBeGreaterThan(0);
  });

  test("summaries carry the git dates that were passed in", () => {
    expect(manifest.notes["Home.md"]?.modified).toBe("2026-08-20T10:00:00+09:00");
    expect(manifest.notes["Note A.md"]?.modified).toBeNull();
    expect(manifest.notes["b/Deep.md"]?.folder).toBe("b");
    expect(manifest.notes["Note A.md"]?.tags).toEqual(["alpha", "gamma"]);
  });

  test("every note has a JSON file named after its asset id", async () => {
    const files = await readdir(join(outDir, "vault", "notes"));
    expect(files).toHaveLength(manifest.noteCount);
    for (const [path, summary] of Object.entries(manifest.notes)) {
      expect(summary.id).toBe(await assetId(path));
      expect(files).toContain(`${summary.id}.json`);
    }
  });

  test("rendered HTML resolves wikilinks to /note/ and embeds to /files/", async () => {
    const home = await staticNote("Home.md");
    expect(home.title).toBe("ホーム");
    expect(home.html).toContain(`href="/note/${encodeURIComponent("Note A")}"`);
    expect(home.html).toContain('class="wikilink"');
    // `[[存在しないノート]]` stays a span-less anchor marked unresolved.
    expect(home.html).toContain("unresolved");
    // `![[pic.png]]` — the image src is the asset id, never the vault path.
    const picture = manifest.attachments["attachments/pic.png"];
    expect(picture).toBeDefined();
    expect(home.html).toContain(`src="${picture?.url}"`);
    expect(picture?.url).toBe(`/files/${picture?.id}.png`);
    expect(home.html).not.toContain('src="/files/attachments/pic.png"');
  });

  test("links and unresolved targets are recorded on the note", async () => {
    const home = await staticNote("Home.md");
    expect(home.links.some((link) => link.to === "Note A.md")).toBe(true);
    expect(home.unresolvedTargets).toContain("存在しないノート");
    expect(home.headings.map((heading) => heading.slug)).not.toContain("");
  });

  test("backlink excerpts are plain text", async () => {
    const noteA = await staticNote("Note A.md");
    const backlink = noteA.backlinks.find((entry) => entry.from === "a/Duplicate.md");
    expect(backlink).toBeDefined();
    expect(backlink?.fromTitle).toBe("Duplicate");
    expect(backlink?.excerpt).toBe("同名ノート A 側。Note A を参照する。");
    for (const entry of noteA.backlinks) {
      expect(entry.excerpt).not.toContain("[[");
      expect(entry.excerpt).not.toContain("]]");
    }
  });

  test("search.json holds plain text, tags and folders", () => {
    expect(docs).toHaveLength(manifest.noteCount);
    const home = docs.find((doc) => doc.path === "Home.md");
    expect(home?.text).not.toContain("[[Note A]]");
    expect(home?.text).not.toContain("![[");
    expect(home?.text).not.toContain("==");
    expect(home?.text).not.toContain("消える");
    expect(home?.text).toContain("メモのタイトル");
    expect(home?.tags).toContain("alpha");
    expect(home?.folder).toBe("");
    expect(docs.find((doc) => doc.path === "b/Deep.md")?.folder).toBe("b");
  });

  test("whitelisted attachments are copied under their asset id", async () => {
    const files = await readdir(join(outDir, "files"));
    expect(files.sort()).toHaveLength(manifest.attachmentCount);
    expect(manifest.attachmentCount).toBe(2);
    for (const ref of Object.values(manifest.attachments)) {
      expect(files).toContain(`${ref.id}.${ref.ext}`);
      expect(ref.url).toBe(`/files/${ref.id}.${ref.ext}`);
      expect(ref.size).toBeGreaterThan(0);
    }
    expect(Object.keys(manifest.attachments).sort()).toEqual([
      "attachments/handout.pdf",
      "attachments/pic.png",
    ]);
  });

  test("tags, unresolved targets, graph and logs are derived from the index", () => {
    expect(manifest.tags[0]?.count).toBeGreaterThanOrEqual(
      manifest.tags[manifest.tags.length - 1]?.count ?? 0,
    );
    expect(manifest.tags.map((entry) => entry.tag)).toContain("alpha");

    const missing = manifest.unresolved.find((entry) => entry.target === "存在しないノート");
    expect(missing?.count).toBe(1);
    expect(missing?.from).toEqual(["Home.md"]);

    const nodes = new Map(manifest.graph.nodes.map((n) => [n.id, n]));
    expect(nodes.get("Note A.md")?.kind).toBe("note");
    expect(nodes.get("unresolved:存在しないノート")?.kind).toBe("unresolved");
    expect(nodes.get("Note A.md")?.inDegree).toBeGreaterThan(0);
    expect(
      manifest.graph.edges.some((edge) => edge.source === "Home.md" && edge.target === "Note A.md"),
    ).toBe(true);
    // The fixture has no `00_Daily` notes and no Claude logs.
    expect(manifest.daily).toEqual([]);
    expect(manifest.logs.items).toEqual([]);
    expect(manifest.logs.projects).toEqual([]);
  });

  test("only vault/ and files/ are rebuilt", async () => {
    expect(existsSync(join(outDir, "robots.txt"))).toBe(true);
    await writeFile(join(outDir, "vault", "stale.json"), "{}", "utf8");
    await buildStaticBundle({
      vaultDir: FIXTURE,
      outDir,
      commit: "deadbeef",
      branch: "main",
    });
    expect(existsSync(join(outDir, "vault", "stale.json"))).toBe(false);
    expect(existsSync(join(outDir, "robots.txt"))).toBe(true);
    expect(existsSync(join(outDir, "vault", "manifest.json"))).toBe(true);
  });
});

describe("searchDocs", () => {
  test("finds Japanese substrings and points ranges at the match", () => {
    const hits = searchDocs(docs, "パラグラフ");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.path).toBe("Note A.md");
    const snippet = hits[0]?.snippets[0];
    expect(snippet).toBeDefined();
    expect(snippet?.ranges.length).toBeGreaterThan(0);
    for (const [start, end] of snippet?.ranges ?? []) {
      expect(snippet?.text.slice(start, end)).toBe("パラグラフ");
    }
    expect(snippet?.text).not.toContain("#");
  });

  test("title matches rank above body-only matches", () => {
    const hits = searchDocs(docs, "note a");
    expect(hits[0]?.path).toBe("Note A.md");
    expect(hits.length).toBeGreaterThan(1);
  });

  test("empty queries and a zero limit return nothing", () => {
    expect(searchDocs(docs, "")).toEqual([]);
    expect(searchDocs(docs, "   ")).toEqual([]);
    expect(searchDocs(docs, "パラグラフ", { limit: 0 })).toEqual([]);
  });

  test("limit, folder and tag narrow the result set", () => {
    expect(searchDocs(docs, "ノート", { limit: 1 })).toHaveLength(1);

    const inB = searchDocs(docs, "Duplicate", { folder: "b" });
    expect(inB.length).toBeGreaterThan(0);
    expect(inB.every((hit) => hit.path.startsWith("b/"))).toBe(true);

    const tagged = searchDocs(docs, "検索", { tag: "gamma" });
    expect(tagged.map((hit) => hit.path)).toEqual(["Note A.md"]);
    expect(searchDocs(docs, "検索", { tag: "#gamma" })).toEqual(tagged);
    expect(searchDocs(docs, "検索", { tag: "nope" })).toEqual([]);
  });
});

process.on("exit", () => {
  if (outDir) void rm(outDir, { recursive: true, force: true });
});
