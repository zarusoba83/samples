require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// EJSテンプレートエンジン
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ミドルウェア
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// セッション設定
const SQLiteStore = require('connect-sqlite3')(session);
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, '../data'),
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8時間
  },
}));

// ルート
app.use('/admin', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/coupon', require('./routes/coupon'));

app.get('/', (req, res) => res.redirect('/admin/dashboard'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'ページが見つかりません' });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'サーバーエラーが発生しました' });
});

module.exports = app;
