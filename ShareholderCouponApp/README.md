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

### 公開エンドポイント（認証不要）

| メソッド | パス | 説明 | レスポンス例 |
|---------|------|------|-------------|
| `GET` | `/login` | ログイン画面を表示 | HTML |
| `GET` | `/simplewebauthn-browser.js` | WebAuthn ブラウザライブラリ配信 | JavaScript |
| `GET` | `/api/auth/has-credentials` | パスキー登録済みか確認 | `{ "hasCredentials": false }` |
| `GET` | `/api/auth/status` | 現在の認証状態を確認 | `{ "authenticated": false }` |
| `POST` | `/api/auth/register/options` | パスキー登録オプションを生成 | WebAuthn PublicKeyCredentialCreationOptions |
| `POST` | `/api/auth/register/verify` | パスキー登録を検証・セッション開始 | `{ "verified": true }` |
| `POST` | `/api/auth/authenticate/options` | パスキー認証オプションを生成 | WebAuthn PublicKeyCredentialRequestOptions |
| `POST` | `/api/auth/authenticate/verify` | パスキー認証を検証・セッション開始 | `{ "verified": true }` |

### 保護エンドポイント（認証必須）

| メソッド | パス | 説明 | レスポンス例 |
|---------|------|------|-------------|
| `GET` | `/` | メイン画面を表示 | HTML |
| `POST` | `/api/auth/logout` | ログアウト（セッション破棄） | `{ "success": true }` |

### クーポン管理 API（認証必須）

#### 一覧取得

```
GET /api/coupons
```

有効期限の昇順で全クーポンを返します。

**レスポンス例:**
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

#### 登録

```
POST /api/coupons
Content-Type: application/json
```

**リクエストボディ:**
```json
{
  "company": "○○ホールディングス",
  "description": "オンラインショップ 1,000円割引",
  "url": "https://example.com/coupon/abc123",
  "expires_at": "2026-06-30",
  "note": "5,000円以上で利用可",
  "shareholder_number": "SH-001234",
  "securities_code": "1234"
}
```

`company` / `description` / `url` / `expires_at` は必須です。
成功時: `201 Created` + 作成されたクーポンオブジェクト

#### 編集

```
PUT /api/coupons/:id
Content-Type: application/json
```

リクエストボディは登録と同様。成功時: `200 OK` + 更新後のクーポンオブジェクト

#### 使用済みトグル

```
PATCH /api/coupons/:id/toggle-used
```

`used` フラグを `0` ↔ `1` で切り替えます。`used` が `1` になる際に `used_at` を記録します。

#### 削除

```
DELETE /api/coupons/:id
```

成功時: `{ "success": true }`

#### エラーレスポンス

| ステータス | 例 |
|-----------|-----|
| `400 Bad Request` | `{ "error": "必須項目が不足しています" }` |
| `401 Unauthorized` | `{ "error": "認証が必要です", "redirect": "/login" }` |
| `404 Not Found` | `{ "error": "見つかりません" }` |

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
