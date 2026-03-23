const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, '../../data/coupon.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shareholders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    shareholder_number TEXT UNIQUE NOT NULL,
    shares_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupon_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    discount_value INTEGER,
    discount_type TEXT DEFAULT 'fixed',
    valid_from TEXT,
    valid_until TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    shareholder_id INTEGER NOT NULL,
    coupon_code TEXT UNIQUE NOT NULL,
    access_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'unused',
    used_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES coupon_campaigns(id),
    FOREIGN KEY (shareholder_id) REFERENCES shareholders(id)
  );
`);

// 初期管理者アカウント作成
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (adminCount.count === 0) {
  const username = process.env.ADMIN_INITIAL_USERNAME || 'admin';
  const password = process.env.ADMIN_INITIAL_PASSWORD || 'changeme';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(username, hash);
  console.log(`初期管理者アカウントを作成しました: ${username}`);
}

module.exports = db;
