import type {
  ClaudeLog,
  GraphEdge,
  GraphNode,
  StaticNote,
  VaultManifest,
} from "@Onyx/vault/static/types";
import { MANIFEST_PATH, noteAssetPath } from "@Onyx/vault/static/types";
import { createServerFn } from "@tanstack/react-start";

import { notFoundError } from "#/lib/errors";

import { readJsonAsset } from "./assets";
import { authMiddleware } from "./middleware";
import { noStore } from "./response";

/**
 * vault のデータ層。
 *
 * データベースは無く、GitHub Actions が焼いた静的バンドル
 * (`/vault/manifest.json`, `/vault/notes/<id>.json`)を Workers の静的アセットから
 * 読むだけ。git はどこでも実行しない。バンドルの契約は
 * `packages/vault/src/static/types.ts`。
 *
 * server function は「ルートとは独立に叩ける API」なので、ここのすべてに
 * `authMiddleware` を付けてセッションを必須にしている。
 */

/**
 * JSON に落ちる値だけを表す型。
 *
 * server function の戻り値は TanStack Start のシリアライザを通るので、
 * `unknown`(= 何が入っているか型では分からない)は受け付けられない。
 * frontmatter の中身は JSON.parse の結果そのものなので、実体は必ずこの形。
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** `StaticNote` の frontmatter を JSON 値に締めたもの(中身は同じ)。 */
export interface NotePayload extends Omit<StaticNote, "frontmatter"> {
  frontmatter: Record<string, JsonValue>;
}

/** 日次ノートが置かれるフォルダ(`00_Daily/YYYY/MM/DD.md`)。 */
const DAILY_ROOT = "00_Daily";

/** グラフで「まだファイルが無いリンク先」を表す node id の接頭辞。 */
const UNRESOLVED_PREFIX = "unresolved:";

const DEFAULT_GRAPH_DEPTH = 1;
const MAX_GRAPH_DEPTH = 5;

/**
 * isolate ごとの manifest キャッシュ。
 * バンドルはデプロイ単位でしか変わらないので、一度読んだら使い回してよい
 * (デプロイし直せば isolate ごと入れ替わる)。
 */
let cached: VaultManifest | undefined;

async function getManifest(): Promise<VaultManifest> {
  if (cached) return cached;
  const manifest = await readJsonAsset<VaultManifest>(MANIFEST_PATH);
  if (!manifest) {
    throw new Error(
      `vault bundle is missing (${MANIFEST_PATH}). Run \`bun run build:vault\` first.`,
    );
  }
  cached = manifest;
  return manifest;
}

/** クライアントに渡した値から vault パスへ戻す(先頭の `/`、`./`、`\` を吸収)。 */
function normalizePath(input: string): string {
  return input.trim().replaceAll("\\", "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

/** `.md` の有無どちらでも受け付ける。未知なら null。 */
function findNotePath(manifest: VaultManifest, input: string): string | null {
  const normalized = normalizePath(input);
  if (normalized === "") return null;
  if (manifest.notes[normalized]) return normalized;

  const withExtension = `${normalized}.md`;
  if (manifest.notes[withExtension]) return withExtension;

  return null;
}

/** `notes/<id>.json` を読む。バンドルに無ければ null。 */
async function readNote(manifest: VaultManifest, path: string): Promise<NotePayload | null> {
  const summary = manifest.notes[path];
  if (!summary) return null;
  return readJsonAsset<NotePayload>(noteAssetPath(summary.id));
}

function asRecord(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("invalid request payload");
  }
  return data as Record<string, unknown>;
}

function requiredString(data: unknown, key: string): string {
  const value = asRecord(data)[key];
  if (typeof value !== "string" || value === "") {
    throw new Error(`${key} is required`);
  }
  return value;
}

function optionalString(data: unknown, key: string): string | undefined {
  if (data === undefined || data === null) return undefined;
  const value = asRecord(data)[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  return value;
}

function optionalNumber(data: unknown, key: string): number | undefined {
  if (data === undefined || data === null) return undefined;
  const value = asRecord(data)[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a number`);
  }
  return value;
}

/**
 * 一覧系の画面が使う manifest の中身。
 *
 * グラフと Claude ログは専用の server function が切り出して返すので、
 * ここでは省いてある(どちらも vault 全体ぶんの配列で、毎画面に載せると重い)。
 */
export interface VaultCatalog {
  commit: string;
  builtAt: string;
  branch: string;
  noteCount: number;
  attachmentCount: number;
  tree: VaultManifest["tree"];
  notes: VaultManifest["notes"];
  tags: VaultManifest["tags"];
  unresolved: VaultManifest["unresolved"];
  daily: VaultManifest["daily"];
}

/** manifest(グラフとログを除く)。ツリー・タグ・未作成リンク・一覧の元になる。 */
export const fetchCatalog = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<VaultCatalog> => {
    noStore();
    const manifest = await getManifest();
    return {
      commit: manifest.commit,
      builtAt: manifest.builtAt,
      branch: manifest.branch,
      noteCount: manifest.noteCount,
      attachmentCount: manifest.attachmentCount,
      tree: manifest.tree,
      notes: manifest.notes,
      tags: manifest.tags,
      unresolved: manifest.unresolved,
      daily: manifest.daily,
    };
  });

/** 1 ノートぶんの本文 HTML と付随情報。`path` は `.md` を省略してよい。 */
export const fetchNote = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => ({ path: requiredString(data, "path") }))
  .handler(async ({ data }): Promise<NotePayload | null> => {
    noStore();
    const manifest = await getManifest();
    const path = findNotePath(manifest, data.path);
    if (path === null) return null;
    return readNote(manifest, path);
  });

/** `note.get` と同じペイロードを日付で引く(`00_Daily/YYYY/MM/DD.md`)。 */
export const fetchDailyNote = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => ({ date: requiredString(data, "date") }))
  .handler(async ({ data }): Promise<NotePayload | null> => {
    noStore();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return null;

    const manifest = await getManifest();
    const [year, month, day] = data.date.split("-");
    const path = findNotePath(manifest, `${DAILY_ROOT}/${year}/${month}/${day}.md`);
    if (path === null) return null;
    return readNote(manifest, path);
  });

export interface ClaudeLogList {
  items: ClaudeLog[];
  total: number;
  /** 常に全ログを数えるので、クライアントは再取得なしにファセットを切り替えられる。 */
  projects: Array<{ project: string; count: number }>;
}

/** Claude Code の会話ログ(新しい順)。`project` で絞り込む。 */
export const fetchLogs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => ({
    project: optionalString(data, "project"),
    limit: optionalNumber(data, "limit"),
  }))
  .handler(async ({ data }): Promise<ClaudeLogList> => {
    noStore();
    const manifest = await getManifest();
    const { items, projects } = manifest.logs;

    const matched =
      data.project === undefined ? items : items.filter((log) => log.project === data.project);

    const limit = data.limit ?? matched.length;
    return { items: matched.slice(0, limit), total: matched.length, projects };
  });

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** `center` から `depth` ホップ以内の node id(無向、center を含む)。 */
function neighbourhood(edges: GraphEdge[], center: string, depth: number): Set<string> {
  const adjacency = new Map<string, string[]>();
  const connect = (from: string, to: string) => {
    const existing = adjacency.get(from);
    if (existing) existing.push(to);
    else adjacency.set(from, [to]);
  };

  for (const edge of edges) {
    connect(edge.source, edge.target);
    connect(edge.target, edge.source);
  }

  const kept = new Set<string>([center]);
  let frontier = [center];

  for (let step = 0; step < depth; step += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbour of adjacency.get(id) ?? []) {
        if (kept.has(neighbour)) continue;
        kept.add(neighbour);
        next.push(neighbour);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }

  return kept;
}

/**
 * リンクグラフ。`center` 無しなら vault 全体、有りならその周辺 `depth` ホップ。
 * `inDegree` は常に vault 全体での値(バンドル作成時に計算済み)。
 */
export const fetchGraph = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: unknown) => ({
    center: optionalString(data, "center"),
    depth: optionalNumber(data, "depth"),
  }))
  .handler(async ({ data }): Promise<GraphData> => {
    noStore();
    const manifest = await getManifest();
    const { nodes, edges } = manifest.graph;

    if (data.center === undefined) return { nodes, edges };

    const centerId = data.center.startsWith(UNRESOLVED_PREFIX)
      ? data.center
      : (findNotePath(manifest, data.center) ?? data.center);

    if (!nodes.some((node) => node.id === centerId)) {
      throw notFoundError(`unknown graph node: ${data.center}`);
    }

    const depth = Math.min(Math.max(data.depth ?? DEFAULT_GRAPH_DEPTH, 0), MAX_GRAPH_DEPTH);
    const kept = neighbourhood(edges, centerId, depth);

    return {
      nodes: nodes.filter((node) => kept.has(node.id)),
      edges: edges.filter((edge) => kept.has(edge.source) && kept.has(edge.target)),
    };
  });
