const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'coupons.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS coupons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company     TEXT    NOT NULL,
    description TEXT    NOT NULL,
    url         TEXT    NOT NULL,
    expires_at  TEXT    NOT NULL,
    note        TEXT    DEFAULT '',
    used        INTEGER DEFAULT 0,
    used_at     TEXT,
    created_at  TEXT    DEFAULT (datetime('now', 'localtime'))
  )
`);

module.exports = db;
