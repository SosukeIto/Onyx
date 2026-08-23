import { cx } from "@/lib/cx";
import { NavButton } from "./NavButton";
import { NAV_FOOTER, NAV_ORDER, type NavKey, type NavProps } from "./nav";

/**
 * Vertical navigation. Tablet and desktop only — the phone uses `TabBar`.
 * Items are icon-only; the wording lives in the tooltip and `aria-label`.
 */
export function Rail({
  active,
  onSelect,
  hrefs,
  items = NAV_ORDER,
  renderItem,
  className,
}: NavProps) {
  const main = items.filter((key) => !NAV_FOOTER.includes(key));
  const footer = items.filter((key) => NAV_FOOTER.includes(key));

  const render = (key: NavKey) => (
    <NavButton
      active={active === key}
      className="size-11 max-lg:sm:w-13"
      href={hrefs?.[key]}
      iconSize={22}
      key={key}
      navKey={key}
      onSelect={() => onSelect?.(key)}
      renderItem={renderItem}
      tooltipSide="right"
    />
  );

  return (
    <nav
      aria-label="画面切り替え"
      className={cx(
        "z-20 hidden w-[var(--w-rail)] flex-none flex-col items-center gap-0.5 border-line border-r bg-panel py-2 sm:flex",
        className,
      )}
    >
      {main.map(render)}
      <span aria-hidden="true" className="flex-1" />
      {footer.map(render)}
    </nav>
  );
}
