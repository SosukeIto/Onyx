import { IconBase, type IconProps } from "./base";

/** A branch splitting off a trunk — the git branch name, never a commit. */
export function IconBranch(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6.8" cy="6" r="2.4" />
      <circle cx="6.8" cy="18" r="2.4" />
      <circle cx="17.2" cy="6" r="2.4" />
      <path d="M6.8 8.4v7.2" />
      <path d="M17.2 8.4c0 4.3-3.4 7.3-8.7 7.9" />
    </IconBase>
  );
}
