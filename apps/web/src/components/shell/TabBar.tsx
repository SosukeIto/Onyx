import { cx } from "@/lib/cx";
import { NavButton } from "./NavButton";
import { NAV_PHONE, type NavProps } from "./nav";

/**
 * Bottom navigation, phone only (`sm:hidden`). It is a normal flex row at the
 * end of the shell column, so nothing has to reserve space for it; the home
 * indicator is handled with `env(safe-area-inset-bottom)`.
 *
 * Defaults to `NAV_PHONE` — five targets, the most a phone bar can hold at a
 * comfortable hit size. `settings` is therefore not here; see `nav.ts`.
 */
export function TabBar({
  active,
  onSelect,
  hrefs,
  items = NAV_PHONE,
  renderItem,
  className,
}: NavProps) {
  return (
    <nav
      aria-label="画面切り替え"
      className={cx(
        "z-20 flex flex-none items-stretch justify-around gap-0 border-line border-t bg-panel px-1 pb-[env(safe-area-inset-bottom)] sm:hidden",
        className,
      )}
    >
      {items.map((key) => (
        <NavButton
          active={active === key}
          className="min-h-[52px] w-auto max-w-[110px] flex-1 rounded-none"
          href={hrefs?.[key]}
          iconSize={22}
          key={key}
          navKey={key}
          onSelect={() => onSelect?.(key)}
          renderItem={renderItem}
        />
      ))}
    </nav>
  );
}
