import path from "node:path";
import type { Context } from "hono";
import { vaultDir } from "./paths";
import { getStatus } from "./sync";

const PREFIX = "/files/";

/** Only these extensions are served; everything else is rejected. */
const MIME_TYPES: Record<string, string> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	svg: "image/svg+xml",
	pdf: "application/pdf",
	mp3: "audio/mpeg",
	mp4: "video/mp4",
	webm: "video/webm",
};

function isInsideVault(absolute: string): boolean {
	const root = path.resolve(vaultDir);
	return absolute === root || absolute.startsWith(root + path.sep);
}

function normalizeEtag(value: string): string {
	return value.startsWith("W/") ? value.slice(2) : value;
}

/**
 * `GET /files/*` — serve an attachment from the vault clone.
 *
 * The vault-relative path is URI-decoded, resolved against the vault root and
 * rejected when it escapes it (`..`, absolute paths, symlink-style tricks).
 */
export async function serveVaultFile(c: Context): Promise<Response> {
	const raw = c.req.path.startsWith(PREFIX)
		? c.req.path.slice(PREFIX.length)
		: "";
	if (raw === "") {
		return c.text("Not Found", 404);
	}

	let relative: string;
	try {
		relative = decodeURIComponent(raw);
	} catch {
		return c.text("Bad Request", 400);
	}

	if (relative.includes("\0")) {
		return c.text("Bad Request", 400);
	}

	const absolute = path.resolve(vaultDir, relative);
	if (!isInsideVault(absolute)) {
		return c.text("Forbidden", 403);
	}

	const ext = path.extname(absolute).slice(1).toLowerCase();
	const contentType = MIME_TYPES[ext];
	if (!contentType) {
		return c.text("Unsupported Media Type", 415);
	}

	const file = Bun.file(absolute);
	if (!(await file.exists())) {
		return c.text("Not Found", 404);
	}

	const commit = getStatus().commit;
	const headers = new Headers({
		"Content-Type": contentType,
		"Cache-Control": "public, max-age=3600",
		"X-Content-Type-Options": "nosniff",
	});

	// Attachments are user content: never let an SVG pull in anything else.
	if (ext === "svg") {
		headers.set(
			"Content-Security-Policy",
			"default-src 'none'; style-src 'unsafe-inline'",
		);
	}

	if (commit) {
		const etag = `"${commit}"`;
		headers.set("ETag", etag);

		const ifNoneMatch = c.req.header("if-none-match");
		if (ifNoneMatch && normalizeEtag(ifNoneMatch.trim()) === etag) {
			return new Response(null, { status: 304, headers });
		}
	}

	headers.set("Content-Length", String(file.size));
	return new Response(file, { headers });
}
