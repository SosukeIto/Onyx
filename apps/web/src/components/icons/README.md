# アイコン語彙

Onyx の UI テキストは原則ゼロ（`CLAUDE.md` / `.claude/agents/designer.md`）。
画面上の意味はすべてこのアイコン + tooltip / `aria-label` / `title` で担う。
**同じ概念には必ず同じアイコンを使うこと。** 新しい概念が出たらまずこの表に追加する。

## 仕様

- 24px グリッド / `viewBox="0 0 24 24"` / `fill="none"` / `stroke="currentColor"`
- `stroke-width` 既定 1.75（小さいサイズでは `strokeWidth={1.6}` を渡す）
- `stroke-linecap` / `stroke-linejoin` は `round`
- 既定で `aria-hidden="true"`。意味を持たせたい場合は `aria-hidden={false} role="img" aria-label="…"` を渡す
- 色は `currentColor`。親の `text-*` で決める（コンポーネントに色の直値を書かない）

## 使い方

```tsx
import { IconFolder, IconNote } from "@/components/icons";

<IconFolder size={18} />
<IconNote size={15} strokeWidth={1.6} className="text-ink-faint" />
```

### props

| prop | 型 | 既定 | 説明 |
| --- | --- | --- | --- |
| `size` | `number \| string` | `20` | `width` / `height` に入る |
| `strokeWidth` | `number \| string` | `1.75` | 小サイズでは 1.6 |
| `className` | `string` | – | 色・レイアウト用 |
| その他 | `SVGProps<SVGSVGElement>` | – | `aria-*` などをそのまま渡せる |

サイズの目安: レール 22 / ヘッダー 20 / パネル見出し 16 / ツリー行 15 / メタ情報 14。

## 構造・ナビゲーション

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconChevron` | `i-chev` | 開閉トグル | ツリー/frontmatter の開閉、パンくずの区切り |
| `IconChevronLeft` | `i-chev`(180°) | 前へ（時間軸） | カレンダーの前の月、前日のデイリーノート |
| `IconChevronRight` | `i-chev` | 次へ（時間軸） | カレンダーの次の月、翌日のデイリーノート |
| `IconArrowLeft` | `i-arrow-left` | 履歴を戻る | Header の ← ボタン |
| `IconArrowRight` | `i-arrow-right` | 履歴を進む | Header の → ボタン |
| `IconMenu` | `i-menu` | ファイルツリー | phone のドロワー開閉ボタン |
| `IconPanelRight` | `i-panel` | 右サイドバーの開閉 | Header 右端のトグル |
| `IconMore` | `i-more` | 省略された残り件数 | FileTree の「残り n 件」行（数字バッジと併用） |
| `IconTarget` | `i-target` | 現在地へ / 全体表示 | カレンダーの「今日へ」、グラフのフォーカス復帰 |

## vault の対象物

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconNote` | `i-note` | ノート（.md ファイル） | FileTree のファイル行、検索結果、バックリンク |
| `IconFolder` | `i-folder` | フォルダ / パス | FileTree のフォルダ行、NoteInfo のパス、バックリンクの出所 |
| `IconNewNote` | `i-newnote` | 新規ノート | LeftPanel のヘッダー |
| `IconTemplate` | `i-template` | テンプレート | 98_templates 配下、frontmatter の template キー |
| `IconHash` | `i-hash` | タグ | #tag チップ、frontmatter の tags |
| `IconLink` | `i-link` | リンク（発リンク） | NoteInfo のリンク数、embed のヘッダー |
| `IconBacklink` | `i-back` | バックリンク（被リンク） | RightPanel のバックリンクセクション |
| `IconUnlinked` | `i-unlinked` | リンクされていないメンション | RightPanel の unlinked mentions |
| `IconUnresolved` | `i-unresolved` | 未作成ノート / 未作成リンク | RightPanel の未解決リンク、NoteInfo の未作成リンク数 |
| `IconNode` | `i-node` | グラフのノード数 | グラフビューの凡例 |
| `IconEdge` | `i-edge` | グラフのエッジ数 | グラフビューの凡例 |
| `IconOrphan` | `i-orphan` | 孤立ノート | グラフビューの凡例 |

## メタデータ

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconType` | `i-type` | title / 文字数 | frontmatter の title・aliases、NoteInfo の文字数 |
| `IconCalendar` | `i-cal` | date / デイリーノート / 期間 | frontmatter の date、Rail のデイリー |
| `IconClock` | `i-clock` | created / 更新日時 / 最近 | frontmatter の created・updated、NoteInfo の更新日時 |
| `IconKey` | `i-key` | session_id / 識別子 | frontmatter の session_id・id・uid |
| `IconGit` | `i-git` | blob ハッシュ / GitHub オブジェクト | NoteInfo の commit、Header の同期 tooltip |
| `IconSync` | `i-sync` | GitHub 同期状態 | Header の同期ドット |
| `IconInfo` | `i-info` | プロパティ / ファイル情報 / 統計 / note callout | frontmatter の見出し、NoteInfo、未知の frontmatter キー |

## 機能

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconSearch` | `i-search` | 検索 | Rail・LeftPanel の検索ボタン |
| `IconList` | `i-list` | アウトライン | RightPanel のアウトラインセクション |
| `IconGraph` | `i-graph` | グラフビュー / 選択中のノード | Rail・TabBar のグラフ |
| `IconFilter` | `i-filter` | フィルタ | 検索画面のファセット |
| `IconSliders` | `i-sliders` | 設定 / 表示の調整 | Rail・TabBar の設定 |
| `IconSort` | `i-sort` | 並び順 | 検索結果のソート |
| `IconCheck` | `i-check` | タスクのチェック | 本文のタスクリスト（prose.css 側でも使用） |
| `IconAlert` | `i-alert` | warning callout / エラー | Header の同期エラー、warning callout |
| `IconMark` | `i-mark` | ハイライト / 検索の一致件数 | 検索結果のヒット数 |
| `IconClip` | `i-clip` | 添付ファイル | 本文の a.attachment、添付一覧 |
| `IconPlus` | `i-plus` | ズームイン / 追加 | グラフのズーム |
| `IconMinus` | `i-minus` | ズームアウト | グラフのズーム |
| `IconSun` | `i-sun` | ライトテーマ | Header のテーマ切替（ダーク時に表示） |
| `IconMoon` | `i-moon` | ダークテーマ | Header のテーマ切替（ライト時に表示） |

## 検索オプション

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconCase` | `i-case` | 大文字小文字を区別 | 検索オプション |
| `IconRegex` | `i-regex` | 正規表現 | 検索オプション |
| `IconFulltext` | `i-fulltext` | 本文も検索 | 検索オプション |

## グラフの力学パラメータ

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconNodeSize` | `i-nodesize` | ノードサイズ | グラフの設定スライダー |
| `IconDistance` | `i-distance` | リンク距離 | グラフの設定スライダー |
| `IconRepulse` | `i-repulse` | 反発力 | グラフの設定スライダー |

## 拡張（demo 語彙にない追加分）

| アイコン | demo の symbol | 意味 | 使う場所 |
| --- | --- | --- | --- |
| `IconLogo` | `—` | Onyx / vault のルート | Header 左端のロゴボタン（tooltip に vault 名） |
| `IconTip` | `—` | tip callout | blockquote.callout[data-callout=tip]（prose.css 側は CSS mask） |
| `IconQuestion` | `—` | question callout | blockquote.callout[data-callout=question] |
| `IconQuote` | `—` | quote callout / 引用 | blockquote.callout[data-callout=quote] |
| `IconClose` | `—` | 入力のクリア / 閉じる | 検索ボックスのクリアボタン |

## ラベルの扱い

- **操作要素** … `aria-label`（必須）+ ヘッダー / レールは `<Tooltip>`、パネル内は `title` 属性
  （スクロールコンテナの中では吹き出しが見切れるため `title` を使う）
- **非操作要素** … `<span className="sr-only">` + `title` 属性

## 追加のルール

- lucide-react など外部アイコンライブラリは使わない（`apps/web` から依存を外している）
- 絵文字はアイコンとして使わない
- callout のアイコンは HTML をサーバーが返すため React では描けない。
  `apps/web/src/styles/prose.css` の `.callout-title::before` が CSS mask で同じ字形を描いている
