const db = require('../database/db');
const { generateCouponCode, generateAccessToken } = require('../utils/codeGenerator');
const { resolveStatus } = require('../utils/statusResolver');

function issueCouponsForCampaign(campaignId) {
  const campaign = db.prepare('SELECT * FROM coupon_campaigns WHERE id = ?').get(campaignId);
  if (!campaign) throw new Error('キャンペーンが見つかりません');

  // 対象株主を取得（すでに発行済みの株主を除く）
  const shareholders = db.prepare(`
    SELECT s.* FROM shareholders s
    WHERE s.id NOT IN (
      SELECT shareholder_id FROM coupons WHERE campaign_id = ?
    )
  `).all(campaignId);

  if (shareholders.length === 0) return { issued: 0 };

  const insert = db.prepare(`
    INSERT INTO coupons (campaign_id, shareholder_id, coupon_code, access_token, status)
    VALUES (?, ?, ?, ?, 'unused')
  `);

  const issueAll = db.transaction((shareholders) => {
    let issued = 0;
    for (const sh of shareholders) {
      let retries = 0;
      while (retries < 5) {
        try {
          const code = generateCouponCode();
          const token = generateAccessToken();
          insert.run(campaignId, sh.id, code, token);
          issued++;
          break;
        } catch (e) {
          if (e.message.includes('UNIQUE constraint failed')) {
            retries++;
          } else {
            throw e;
          }
        }
      }
    }
    return issued;
  });

  const issued = issueAll(shareholders);
  return { issued };
}

function getCouponByToken(token) {
  return db.prepare(`
    SELECT c.*, s.name as shareholder_name, s.shareholder_number,
           cc.name as campaign_name, cc.description as campaign_description,
           cc.discount_value, cc.discount_type, cc.valid_from, cc.valid_until
    FROM coupons c
    JOIN shareholders s ON c.shareholder_id = s.id
    JOIN coupon_campaigns cc ON c.campaign_id = cc.id
    WHERE c.access_token = ?
  `).get(token);
}

function redeemCoupon(token) {
  const result = db.prepare(`
    UPDATE coupons SET status = 'used', used_at = datetime('now')
    WHERE access_token = ? AND status = 'unused'
  `).run(token);
  return result.changes > 0;
}

function getCouponStats() {
  return db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'unused' THEN 1 ELSE 0 END) as unused,
      SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used
    FROM coupons
  `).get();
}

function getAllCoupons({ campaignId, status, page = 1, perPage = 20 } = {}) {
  const conditions = [];
  const params = [];

  if (campaignId) {
    conditions.push('c.campaign_id = ?');
    params.push(campaignId);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * perPage;

  const rows = db.prepare(`
    SELECT c.*, s.name as shareholder_name, s.shareholder_number,
           cc.name as campaign_name, cc.valid_until
    FROM coupons c
    JOIN shareholders s ON c.shareholder_id = s.id
    JOIN coupon_campaigns cc ON c.campaign_id = cc.id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `).all([...params, perPage, offset]);

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM coupons c ${where}
  `).get(params);

  return { rows, total: countRow.total, page, perPage };
}

function getCouponById(id) {
  return db.prepare(`
    SELECT c.*, s.name as shareholder_name, s.shareholder_number, s.email,
           cc.name as campaign_name, cc.description as campaign_description,
           cc.discount_value, cc.discount_type, cc.valid_from, cc.valid_until
    FROM coupons c
    JOIN shareholders s ON c.shareholder_id = s.id
    JOIN coupon_campaigns cc ON c.campaign_id = cc.id
    WHERE c.id = ?
  `).get(id);
}

function revokeCoupon(id) {
  const result = db.prepare(`
    UPDATE coupons SET status = 'used', used_at = datetime('now')
    WHERE id = ? AND status = 'unused'
  `).run(id);
  return result.changes > 0;
}

module.exports = {
  issueCouponsForCampaign,
  getCouponByToken,
  redeemCoupon,
  getCouponStats,
  getAllCoupons,
  getCouponById,
  revokeCoupon,
  resolveStatus,
};
