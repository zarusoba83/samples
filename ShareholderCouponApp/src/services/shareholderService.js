const db = require('../database/db');

function getAllShareholders({ page = 1, perPage = 20, search = '' } = {}) {
  const offset = (page - 1) * perPage;
  const like = `%${search}%`;
  const rows = db.prepare(`
    SELECT s.*, COUNT(c.id) as coupon_count
    FROM shareholders s
    LEFT JOIN coupons c ON s.id = c.shareholder_id
    WHERE s.name LIKE ? OR s.shareholder_number LIKE ? OR s.email LIKE ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(like, like, like, perPage, offset);

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM shareholders
    WHERE name LIKE ? OR shareholder_number LIKE ? OR email LIKE ?
  `).get(like, like, like);

  return { rows, total: countRow.total, page, perPage };
}

function getShareholderById(id) {
  const shareholder = db.prepare('SELECT * FROM shareholders WHERE id = ?').get(id);
  if (!shareholder) return null;

  const coupons = db.prepare(`
    SELECT c.*, cc.name as campaign_name
    FROM coupons c
    JOIN coupon_campaigns cc ON c.campaign_id = cc.id
    WHERE c.shareholder_id = ?
    ORDER BY c.created_at DESC
  `).all(id);

  return { ...shareholder, coupons };
}

function createShareholder({ name, email, shareholder_number, shares_count }) {
  const result = db.prepare(`
    INSERT INTO shareholders (name, email, shareholder_number, shares_count)
    VALUES (?, ?, ?, ?)
  `).run(name, email || null, shareholder_number, shares_count || 0);
  return result.lastInsertRowid;
}

function updateShareholder(id, { name, email, shareholder_number, shares_count }) {
  db.prepare(`
    UPDATE shareholders SET name = ?, email = ?, shareholder_number = ?, shares_count = ?
    WHERE id = ?
  `).run(name, email || null, shareholder_number, shares_count || 0, id);
}

function deleteShareholder(id) {
  db.prepare('DELETE FROM shareholders WHERE id = ?').run(id);
}

module.exports = {
  getAllShareholders,
  getShareholderById,
  createShareholder,
  updateShareholder,
  deleteShareholder,
};
