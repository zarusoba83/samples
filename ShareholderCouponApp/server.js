const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 一覧取得
app.get('/api/coupons', (req, res) => {
  const coupons = db.prepare(`
    SELECT * FROM coupons ORDER BY expires_at ASC
  `).all();
  res.json(coupons);
});

// 登録
app.post('/api/coupons', (req, res) => {
  const { company, description, url, expires_at, note, shareholder_number, securities_code } = req.body;
  if (!company || !description || !url || !expires_at) {
    return res.status(400).json({ error: '必須項目が不足しています' });
  }
  const result = db.prepare(`
    INSERT INTO coupons (company, description, url, expires_at, note, shareholder_number, securities_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(company, description, url, expires_at, note || '', shareholder_number || '', securities_code || '');
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(coupon);
});

// 使用済みトグル
app.patch('/api/coupons/:id/toggle-used', (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!coupon) return res.status(404).json({ error: '見つかりません' });

  const newUsed = coupon.used ? 0 : 1;
  const usedAt = newUsed ? new Date().toISOString() : null;
  db.prepare(`
    UPDATE coupons SET used = ?, used_at = ? WHERE id = ?
  `).run(newUsed, usedAt, req.params.id);
  res.json(db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id));
});

// 削除
app.delete('/api/coupons/:id', (req, res) => {
  const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '見つかりません' });
  res.json({ success: true });
});

// 編集
app.put('/api/coupons/:id', (req, res) => {
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
