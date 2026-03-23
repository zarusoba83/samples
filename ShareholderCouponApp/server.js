const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const db = require('./db');

const app = express();
const PORT    = process.env.PORT    || 3000;
const RP_ID   = process.env.RP_ID   || 'localhost';
const RP_NAME = process.env.RP_NAME || '株主優待 URL管理';
const ORIGIN  = process.env.ORIGIN  || `http://localhost:${PORT}`;

app.use(express.json());
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: __dirname }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// 認証ミドルウェア
function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  res.status(401).json({ error: '認証が必要です', redirect: '/login' });
}

// ==============================
// 公開ルート
// ==============================

// @simplewebauthn/browser UMD バンドルを配信
app.get('/simplewebauthn-browser.js', (_req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/@simplewebauthn/browser/dist/bundle/index.umd.min.js'));
});

// ログインページ
app.get('/login', (req, res) => {
  if (req.session?.authenticated) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ==============================
// 認証 API（認証不要）
// ==============================

// クレデンシャル登録済みかどうか
app.get('/api/auth/has-credentials', (_req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM credentials').get().n;
  res.json({ hasCredentials: count > 0 });
});

// 認証ステータス
app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: !!req.session?.authenticated });
});

// パスキー登録: オプション生成
app.post('/api/auth/register/options', async (req, res) => {
  try {
    const existingCreds = db.prepare('SELECT id, transports FROM credentials').all();
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: 'shareholder',
      userDisplayName: '株主',
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
      excludeCredentials: existingCreds.map(c => ({
        id: Buffer.from(c.id, 'base64url'),
        type: 'public-key',
        transports: JSON.parse(c.transports),
      })),
    });
    req.session.challenge = options.challenge;
    res.json(options);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// パスキー登録: 検証
app.post('/api/auth/register/verify', async (req, res) => {
  try {
    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: req.session.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
    if (!verified) return res.status(400).json({ error: '登録の検証に失敗しました' });

    const { credentialID, credentialPublicKey, counter } = registrationInfo;
    const transports = req.body.response?.transports || [];
    db.prepare(`
      INSERT OR REPLACE INTO credentials (id, public_key, counter, transports)
      VALUES (?, ?, ?, ?)
    `).run(
      Buffer.from(credentialID).toString('base64url'),
      Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      JSON.stringify(transports),
    );
    delete req.session.challenge;
    req.session.authenticated = true;
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// パスキー認証: オプション生成
app.post('/api/auth/authenticate/options', async (req, res) => {
  try {
    const creds = db.prepare('SELECT id, transports FROM credentials').all();
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: creds.map(c => ({
        id: Buffer.from(c.id, 'base64url'),
        type: 'public-key',
        transports: JSON.parse(c.transports),
      })),
    });
    req.session.challenge = options.challenge;
    res.json(options);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// パスキー認証: 検証
app.post('/api/auth/authenticate/verify', async (req, res) => {
  try {
    const credId = req.body.id; // base64url
    const cred = db.prepare('SELECT * FROM credentials WHERE id = ?').get(credId);
    if (!cred) return res.status(404).json({ error: 'クレデンシャルが見つかりません' });

    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: req.session.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(cred.id, 'base64url'),
        credentialPublicKey: new Uint8Array(Buffer.from(cred.public_key, 'base64')),
        counter: cred.counter,
        transports: JSON.parse(cred.transports),
      },
    });
    if (!verified) return res.status(400).json({ error: '認証の検証に失敗しました' });

    db.prepare('UPDATE credentials SET counter = ? WHERE id = ?')
      .run(authenticationInfo.newCounter, cred.id);
    delete req.session.challenge;
    req.session.authenticated = true;
    res.json({ verified: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ログアウト
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ==============================
// 保護されたルート
// ==============================

// メインアプリ
app.get('/', requireAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 静的ファイル（認証後のみ）
app.use(requireAuth, express.static(path.join(__dirname, 'public')));

// ==============================
// クーポン API（認証必須）
// ==============================

// 一覧取得
app.get('/api/coupons', requireAuth, (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY expires_at ASC').all();
  res.json(coupons);
});

// 登録
app.post('/api/coupons', requireAuth, (req, res) => {
  const { company, description, url, expires_at, note, shareholder_number, securities_code } = req.body;
  if (!company || !description || !url || !expires_at) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  const result = db.prepare(`
    INSERT INTO coupons (company, description, url, expires_at, note, shareholder_number, securities_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(company, description, url, expires_at, note || '', shareholder_number || '', securities_code || '');
  res.status(201).json(db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid));
});

// 使用済みトグル
app.patch('/api/coupons/:id/toggle-used', requireAuth, (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!coupon) return res.status(404).json({ error: '見つかりません' });
  const newUsed = coupon.used ? 0 : 1;
  db.prepare('UPDATE coupons SET used = ?, used_at = ? WHERE id = ?')
    .run(newUsed, newUsed ? new Date().toISOString() : null, req.params.id);
  res.json(db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id));
});

// 削除
app.delete('/api/coupons/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '見つかりません' });
  res.json({ success: true });
});

// 編集
app.put('/api/coupons/:id', requireAuth, (req, res) => {
  const { company, description, url, expires_at, note, shareholder_number, securities_code } = req.body;
  if (!company || !description || !url || !expires_at) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  db.prepare(`
    UPDATE coupons SET company=?, description=?, url=?, expires_at=?, note=?, shareholder_number=?, securities_code=? WHERE id=?
  `).run(company, description, url, expires_at, note || '', shareholder_number || '', securities_code || '', req.params.id);
  res.json(db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id));
});

app.listen(PORT, () => {
  console.log(`株主優待管理アプリ起動中: http://localhost:${PORT}`);
});
