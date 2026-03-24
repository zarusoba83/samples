const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'coupons.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS coupons (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    company            TEXT    NOT NULL,
    description        TEXT    NOT NULL,
    url                TEXT    NOT NULL,
    expires_at         TEXT    NOT NULL,
    note               TEXT    DEFAULT '',
    shareholder_number TEXT    DEFAULT '',
    securities_code    TEXT    DEFAULT '',
    used               INTEGER DEFAULT 0,
    used_at            TEXT,
    created_at         TEXT    DEFAULT (datetime('now', 'localtime'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS credentials (
    id          TEXT    PRIMARY KEY,
    public_key  TEXT    NOT NULL,
    counter     INTEGER DEFAULT 0,
    transports  TEXT    DEFAULT '[]',
    created_at  TEXT    DEFAULT (datetime('now', 'localtime'))
  )
`);

// 既存DBへのカラム追加（マイグレーション）
const cols = db.pragma('table_info(coupons)').map(c => c.name);
if (!cols.includes('shareholder_number')) db.exec("ALTER TABLE coupons ADD COLUMN shareholder_number TEXT DEFAULT ''");
if (!cols.includes('securities_code'))    db.exec("ALTER TABLE coupons ADD COLUMN securities_code TEXT DEFAULT ''");

module.exports = db;
