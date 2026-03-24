# 株主優待 URL管理アプリ

株主として保有している株式の株主優待URLを一元管理するWebアプリです。
株主サイトで手動発行したURLを登録し、有効期限・使用状況をまとめて確認できます。

## 機能一覧

- **優待URLの登録・管理** — 会社名・優待内容・URL・有効期限をまとめて記録
- **ステータス自動判定** — 有効 / 期限間近（14日以内）/ 期限切れ / 使用済みを自動で分類
- **サマリー表示** — 各ステータスの件数を画面上部に一覧表示
- **フィルタリング** — ステータス別に絞り込んで表示
- **URL表示・コピー** — クーポンURLをワンタップで表示・クリップボードコピー・ブラウザで開く
- **使用済みマーク** — 使用後にトグルで記録（解除も可能）
- **株主番号・証券コード管理** — 任意で紐付けて管理
- **パスキー認証** — 生体認証（指紋・顔認証）によるパスワード不要のログイン

## 必要環境

| 項目 | バージョン |
|------|-----------|
| Node.js | 18.x 以上 |
| npm | 8.x 以上 |
| OS | Windows / macOS / Linux |

## セットアップ

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd ShareholderCouponApp

# 2. 依存パッケージをインストール
npm install

# 3. アプリを起動
npm start
```

起動後、ブラウザで `http://localhost:3000` にアクセスしてください。

開発時は以下のコマンドでファイル変更を自動検知して再起動できます。

```bash
npm run dev
```

## 環境変数

`.env` ファイルを作成するか、環境変数として設定することでカスタマイズできます。

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `PORT` | `3000` | サーバーのリッスンポート |
| `RP_ID` | `localhost` | WebAuthn リライングパーティID（本番環境ではドメイン名を設定） |
| `RP_NAME` | `株主優待 URL管理` | WebAuthn リライングパーティ表示名 |
| `ORIGIN` | `http://localhost:3000` | WebAuthn の期待オリジン（本番環境では `https://yourdomain.com`） |
| `SESSION_SECRET` | `dev-secret-change-in-production` | セッション暗号化キー（**本番環境では必ず変更してください**） |

本番環境での設定例：

```bash
PORT=443
RP_ID=yourdomain.com
ORIGIN=https://yourdomain.com
SESSION_SECRET=ランダムな長い文字列
```

## 初回セットアップ（パスキー登録）

初めてアクセスするとログインページが表示されます。

1. ブラウザで `http://localhost:3000` を開く
2. 「📲 パスキーを登録する」ボタンをクリック
3. デバイスの生体認証（指紋・顔認証・PINなど）を行う
4. 認証成功後、自動的にメイン画面に遷移します

> **別デバイスで使う場合**
> ログインページ下部の「＋ 新しいパスキーを追加」から追加のパスキーを登録できます。
> パスキーは各デバイスに保存されるため、デバイスごとに登録が必要です。

## 使い方

### 株主優待を追加する

1. 株主サイトにログインし、株主優待のURLを発行する（手動操作）
2. アプリ上部の「＋ 優待を追加」ボタンをクリック
3. 以下の情報を入力する

   | フィールド | 必須 | 説明 |
   |-----------|------|------|
   | 会社名 | ✅ | 例：○○ホールディングス |
   | 優待内容 | ✅ | 例：オンラインショップ 1,000円割引 |
   | 優待URL | ✅ | 株主サイトで発行されたURL |
   | 有効期限 | ✅ | URLの有効期限 |
   | 株主番号 | — | 任意。例：SH-001234 |
   | 証券コード | — | 任意。例：7203 |
   | メモ | — | 任意。利用条件など |

4. 「保存」をクリックして登録完了

### URLを使用する

1. カードのURL部分をタップ/クリックしてURLを表示
2. 「ブラウザで開く」で直接アクセス、または「コピー」でURLをコピー
3. 使用後はカード下部の「使用済みにする」ボタンをクリック

### フィルタリング

ページ上部のボタンでステータス別に絞り込めます。

## ステータス一覧

| ステータス | 条件 | カード表示 |
|-----------|------|-----------|
| 有効 | 有効期限内・未使用 | 青い左ボーダー |
| 期限間近 | 有効期限まで14日以内・未使用 | 橙色の左ボーダー・黄色背景 |
| 期限切れ | 有効期限を過ぎた・未使用 | グレーの左ボーダー・半透明 |
| 使用済み | 「使用済みにする」でマーク済み | 緑の左ボーダー・緑背景 |

## APIリファレンス

### 共通エラーレスポンス

すべての API エンドポイントで発生しうるエラーは以下の形式で返されます。

```json
{ "error": "エラーメッセージ" }
```

| ステータス | 発生条件 |
|-----------|---------|
| `400 Bad Request` | バリデーションエラー・WebAuthn 検証失敗 |
| `401 Unauthorized` | 未認証状態で保護エンドポイントにアクセス |
| `404 Not Found` | 対象リソースが存在しない |
| `500 Internal Server Error` | サーバー内部エラー（WebAuthn 処理失敗など） |

`401` の場合はリダイレクト先も含まれます:
```json
{ "error": "認証が必要です", "redirect": "/login" }
```

---

### 認証 API（認証不要）

#### GET `/api/auth/has-credentials`

パスキーが登録済みかどうかを確認します。

**レスポンス**
```json
{ "hasCredentials": false }
```

---

#### GET `/api/auth/status`

現在のセッションの認証状態を返します。

**レスポンス**
```json
{ "authenticated": true }
```

---

#### POST `/api/auth/register/options`

パスキー登録用の WebAuthn チャレンジを生成します。生成されたチャレンジはセッションに保存されます。

**レスポンス**: WebAuthn `PublicKeyCredentialCreationOptions`（`@simplewebauthn/browser` の `startRegistration()` にそのまま渡す）

**エラー**

| ステータス | 説明 |
|-----------|------|
| `500` | オプション生成に失敗した場合 |

---

#### POST `/api/auth/register/verify`

`startRegistration()` の戻り値を送信し、パスキー登録を完了します。

**リクエストボディ**: `startRegistration()` の戻り値をそのまま送信

**レスポンス**
```json
{ "verified": true }
```

成功するとセッションが認証済み状態（`authenticated: true`）になります。

**エラー**

| ステータス | 説明 |
|-----------|------|
| `400` | チャレンジ不一致・署名検証失敗・オリジン不一致 |
| `500` | 検証処理中のサーバーエラー |

---

#### POST `/api/auth/authenticate/options`

パスキー認証用の WebAuthn チャレンジを生成します。

**レスポンス**: WebAuthn `PublicKeyCredentialRequestOptions`（`startAuthentication()` にそのまま渡す）

**エラー**

| ステータス | 説明 |
|-----------|------|
| `500` | オプション生成に失敗した場合 |

---

#### POST `/api/auth/authenticate/verify`

`startAuthentication()` の戻り値を送信し、認証を完了します。

**リクエストボディ**: `startAuthentication()` の戻り値をそのまま送信

**レスポンス**
```json
{ "verified": true }
```

成功するとセッションが認証済み状態になり、クレデンシャルのカウンターが更新されます。

**エラー**

| ステータス | 説明 |
|-----------|------|
| `400` | チャレンジ不一致・署名検証失敗・カウンター異常（リプレイ攻撃の可能性） |
| `404` | 送信されたクレデンシャル ID が DB に存在しない |
| `500` | 検証処理中のサーバーエラー |

---

#### POST `/api/auth/logout`

セッションを破棄してログアウトします。（要認証）

**レスポンス**
```json
{ "success": true }
```

---

### メイン画面（認証必須）

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/` | メイン画面を返す。未認証の場合は `/login` にリダイレクト |

### クーポン管理 API（認証必須）

#### GET `/api/coupons` — 一覧取得

有効期限の昇順で全クーポンを返します。

**レスポンス** `200 OK`
```json
[
  {
    "id": 1,
    "company": "○○ホールディングス",
    "description": "オンラインショップ 1,000円割引",
    "url": "https://example.com/coupon/abc123",
    "expires_at": "2026-06-30",
    "note": "5,000円以上の購入で利用可",
    "shareholder_number": "SH-001234",
    "securities_code": "1234",
    "used": 0,
    "used_at": null,
    "created_at": "2026-03-24 10:00:00"
  }
]
```

**エラー**

| ステータス | 説明 |
|-----------|------|
| `401` | 未認証 |

---

#### POST `/api/coupons` — 登録

**リクエストボディ**

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|-----|------|
| `company` | string | ✅ | 会社名 |
| `description` | string | ✅ | 優待内容 |
| `url` | string | ✅ | クーポンURL |
| `expires_at` | string | ✅ | 有効期限（YYYY-MM-DD） |
| `note` | string | — | メモ |
| `shareholder_number` | string | — | 株主番号 |
| `securities_code` | string | — | 証券コード |

**レスポンス** `201 Created` — 作成されたクーポンオブジェクト

**エラー**

| ステータス | 説明 |
|-----------|------|
| `400` | `company` / `description` / `url` / `expires_at` のいずれかが未指定 |
| `401` | 未認証 |

---

#### PUT `/api/coupons/:id` — 編集

リクエストボディは登録と同様（全フィールドを送信）。

**レスポンス** `200 OK` — 更新後のクーポンオブジェクト

**エラー**

| ステータス | 説明 |
|-----------|------|
| `400` | 必須フィールドが未指定 |
| `401` | 未認証 |

---

#### PATCH `/api/coupons/:id/toggle-used` — 使用済みトグル

`used` フラグを `0` ↔ `1` で切り替えます。`1` になるとき `used_at` に現在時刻を記録し、`0` に戻すと `used_at` は `null` になります。

**レスポンス** `200 OK` — 更新後のクーポンオブジェクト

**エラー**

| ステータス | 説明 |
|-----------|------|
| `401` | 未認証 |
| `404` | 指定した `id` のクーポンが存在しない |

---

#### DELETE `/api/coupons/:id` — 削除

**レスポンス** `200 OK`
```json
{ "success": true }
```

**エラー**

| ステータス | 説明 |
|-----------|------|
| `401` | 未認証 |
| `404` | 指定した `id` のクーポンが存在しない |

## データベース設計

データは SQLite ファイル (`coupons.db`) に保存されます。セッションは `sessions.db` に保存されます。

### `coupons` テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | INTEGER PK | 自動採番 |
| `company` | TEXT (NOT NULL) | 会社名 |
| `description` | TEXT (NOT NULL) | 優待内容 |
| `url` | TEXT (NOT NULL) | クーポンURL |
| `expires_at` | TEXT (NOT NULL) | 有効期限（YYYY-MM-DD） |
| `note` | TEXT | メモ（任意） |
| `shareholder_number` | TEXT | 株主番号（任意） |
| `securities_code` | TEXT | 証券コード（任意） |
| `used` | INTEGER | 使用フラグ（0: 未使用 / 1: 使用済み） |
| `used_at` | TEXT | 使用日時（ISO 8601） |
| `created_at` | TEXT | 登録日時（ローカル時刻） |

### `credentials` テーブル

WebAuthn パスキーの認証情報を保存するテーブルです。

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | TEXT PK | Base64URL エンコードされた認証情報ID |
| `public_key` | TEXT (NOT NULL) | Base64 エンコードされた公開鍵 |
| `counter` | INTEGER | WebAuthn カウンター（リプレイ攻撃防止） |
| `transports` | TEXT | トランスポート種別の JSON 配列（例: `["internal"]`） |
| `created_at` | TEXT | 登録日時（ローカル時刻） |

## アーキテクチャ

```
ShareholderCouponApp/
├── server.js          # Express サーバー、全APIルート定義
├── db.js              # SQLite 接続・テーブル初期化・マイグレーション
├── package.json       # プロジェクト設定・依存関係
├── coupons.db         # クーポン・認証情報データ（起動時に自動生成）
├── sessions.db        # セッションデータ（起動時に自動生成）
└── public/
    ├── index.html     # メイン画面（SPA: インライン CSS/JS）
    └── login.html     # ログイン・パスキー登録画面
```

### 主要ライブラリ

| ライブラリ | 用途 |
|-----------|------|
| `express` | Web フレームワーク |
| `better-sqlite3` | SQLite データベース（同期API） |
| `@simplewebauthn/server` | WebAuthn 認証のサーバー処理 |
| `@simplewebauthn/browser` | WebAuthn 認証のブラウザ処理（UMD バンドルとして配信） |
| `express-session` | セッション管理 |
| `connect-sqlite3` | セッションの SQLite 永続化 |

### 認証フロー

```
ブラウザ                           サーバー
  │                                  │
  │── GET /api/auth/has-credentials ─▶│  登録済みか確認
  │◀─ { hasCredentials: true/false } ─│
  │                                  │
  │ [未登録の場合]                    │
  │── POST /api/auth/register/options ▶│  チャレンジ生成・セッションに保存
  │◀─ WebAuthn 登録オプション ────────│
  │  (生体認証プロンプト表示)          │
  │── POST /api/auth/register/verify ─▶│  署名検証・DB保存・セッション開始
  │◀─ { verified: true } ─────────────│
  │                                  │
  │ [登録済みの場合]                  │
  │── POST /api/auth/authenticate/options ▶│ チャレンジ生成
  │◀─ WebAuthn 認証オプション ─────────│
  │  (生体認証プロンプト表示)           │
  │── POST /api/auth/authenticate/verify ─▶│ 署名検証・カウンター更新・セッション開始
  │◀─ { verified: true } ──────────────│
  │                                   │
  │── GET / ───────────────────────────▶│  メイン画面を返す
```
