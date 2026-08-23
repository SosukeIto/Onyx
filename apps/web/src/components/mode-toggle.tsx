import { IconMoon, IconSun } from "@/components/icons";
import { IconButton } from "@/components/shell/IconButton";
import { Tooltip } from "@/components/shell/Tooltip";
import { useTheme } from "@/components/theme-provider";

/**
 * Single light/dark toggle — no dropdown, no visible wording.
 * Which glyph shows is decided in CSS (`dark:` variant), so there is no
 * hydration flash and no client-only state.
 */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip align="end" label="テーマ切替">
      <IconButton
        label="ライト / ダークテーマを切り替え"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <IconMoon className="dark:hidden" size={20} />
        <IconSun className="hidden dark:block" size={20} />
      </IconButton>
    </Tooltip>
  );
}
