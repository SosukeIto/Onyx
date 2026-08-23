export type ClassValue = string | false | null | undefined;

/**
 * Join class names. Deliberately NOT tailwind-merge: Onyx registers custom
 * theme names (`text-ui`, `text-ink-muted`, …) that tailwind-merge cannot tell
 * apart, and nothing in this app overrides utilities from the outside.
 */
export function cx(...values: ClassValue[]): string {
	return values.filter(Boolean).join(" ");
}
