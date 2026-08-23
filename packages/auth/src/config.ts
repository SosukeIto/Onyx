/**
 * 認証の方針を決める定数。
 *
 * Onyx は「自分の Obsidian vault を自分だけが読む」単一ユーザーのアプリなので、
 * 新規登録(/api/auth/sign-up/email)は閉じている({@link SIGN_UP_ENABLED} = false)。
 * 初期ユーザーは packages/auth/src/create-user.ts の `createUser()` を
 * サーバー側から一度だけ呼んで作る(README.md を参照)。
 */

/** メール + パスワード認証を使うか */
export const EMAIL_AND_PASSWORD_ENABLED = true;

/**
 * 新規登録(/api/auth/sign-up/email)を許可するか。
 * Onyx は招待制(単一ユーザー)なので false。
 * `createUser()` は better-auth の内部 API を直接叩くのでこの設定に縛られない。
 */
export const SIGN_UP_ENABLED = false;

/** メール認証を必須にするか。メール送信基盤は無いので false */
export const REQUIRE_EMAIL_VERIFICATION = false;

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** セッションの有効期間(秒)= 30 日 */
export const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30;

/** セッションの延長間隔(秒)。アクセス時にこの間隔で expiresAt を延ばす */
export const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;

/** アプリ名(better-auth のログや Cookie prefix に使われる) */
export const APP_NAME = "Onyx";
