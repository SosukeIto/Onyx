import { IconBase, type IconProps } from "./base";

/** Speech bubble with a tail — a conversation (Claude のログ). */
export function IconChat(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H9.3L5 20.5V6.5A2.5 2.5 0 0 1 7.5 4h10A2.5 2.5 0 0 1 20 6.5z" />
      <path d="M8.6 8.8h7.8M8.6 12.2h5" />
    </IconBase>
  );
}
