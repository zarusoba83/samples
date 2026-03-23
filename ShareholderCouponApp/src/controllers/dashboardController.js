const db = require('../database/db');
const couponService = require('../services/couponService');

function show(req, res) {
  const couponStats = couponService.getCouponStats();
  const shareholderCount = db.prepare('SELECT COUNT(*) as count FROM shareholders').get().count;
  const campaignCount = db.prepare('SELECT COUNT(*) as count FROM coupon_campaigns').get().count;

  const recentCoupons = db.prepare(`
    SELECT c.*, s.name as shareholder_name, cc.name as campaign_name
    FROM coupons c
    JOIN shareholders s ON c.shareholder_id = s.id
    JOIN coupon_campaigns cc ON c.campaign_id = cc.id
    WHERE c.status = 'used'
    ORDER BY c.used_at DESC
    LIMIT 10
  `).all();

  res.render('admin/dashboard', {
    couponStats,
    shareholderCount,
    campaignCount,
    recentCoupons,
    adminUsername: req.session.adminUsername,
  });
}

module.exports = { show };
