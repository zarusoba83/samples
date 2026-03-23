const db = require('../database/db');

function getAllCampaigns() {
  return db.prepare(`
    SELECT cc.*,
           COUNT(c.id) as total_coupons,
           SUM(CASE WHEN c.status = 'used' THEN 1 ELSE 0 END) as used_coupons
    FROM coupon_campaigns cc
    LEFT JOIN coupons c ON cc.id = c.campaign_id
    GROUP BY cc.id
    ORDER BY cc.created_at DESC
  `).all();
}

function getCampaignById(id) {
  return db.prepare('SELECT * FROM coupon_campaigns WHERE id = ?').get(id);
}

function createCampaign({ name, description, discount_value, discount_type, valid_from, valid_until }) {
  const result = db.prepare(`
    INSERT INTO coupon_campaigns (name, description, discount_value, discount_type, valid_from, valid_until)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    description || null,
    discount_value || null,
    discount_type || 'fixed',
    valid_from || null,
    valid_until || null
  );
  return result.lastInsertRowid;
}

function deleteCampaign(id) {
  db.prepare('DELETE FROM coupons WHERE campaign_id = ?').run(id);
  db.prepare('DELETE FROM coupon_campaigns WHERE id = ?').run(id);
}

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  deleteCampaign,
};
