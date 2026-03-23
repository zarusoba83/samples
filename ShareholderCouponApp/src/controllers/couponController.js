const couponService = require('../services/couponService');
const { resolveStatus } = require('../utils/statusResolver');

// 管理画面: クーポン一覧
function index(req, res) {
  const { page = 1, campaign_id, status } = req.query;
  const data = couponService.getAllCoupons({
    page: parseInt(page),
    campaignId: campaign_id,
    status,
  });
  res.render('admin/coupons/index', {
    ...data,
    filters: { campaign_id, status },
    flash: req.session.flash || null,
  });
  delete req.session.flash;
}

// 管理画面: クーポン詳細
function show(req, res) {
  const coupon = couponService.getCouponById(req.params.id);
  if (!coupon) return res.status(404).render('error', { message: 'クーポンが見つかりません' });
  const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
  const effectiveStatus = resolveStatus(coupon, coupon);
  res.render('admin/coupons/show', { coupon, effectiveStatus, baseUrl });
}

// 管理画面: クーポン無効化
function revoke(req, res) {
  const ok = couponService.revokeCoupon(req.params.id);
  req.session.flash = ok
    ? { type: 'success', message: 'クーポンを無効化しました' }
    : { type: 'warning', message: 'このクーポンは変更できません' };
  res.redirect(`/admin/coupons/${req.params.id}`);
}

// 公開: クーポン表示ページ
function showPublic(req, res) {
  const coupon = couponService.getCouponByToken(req.params.token);
  if (!coupon) return res.status(404).render('public/not_found');

  const effectiveStatus = resolveStatus(coupon, coupon);

  if (effectiveStatus === 'used') return res.render('public/already_used', { coupon });
  if (effectiveStatus === 'expired') return res.render('public/expired', { coupon });
  if (effectiveStatus === 'not_yet') return res.render('public/not_yet', { coupon });

  res.render('public/coupon', { coupon, token: req.params.token });
}

// 公開: クーポン使用処理
function redeemPublic(req, res) {
  const coupon = couponService.getCouponByToken(req.params.token);
  if (!coupon) return res.status(404).render('public/not_found');

  const effectiveStatus = resolveStatus(coupon, coupon);
  if (effectiveStatus !== 'unused') {
    return res.redirect(`/coupon/${req.params.token}`);
  }

  const ok = couponService.redeemCoupon(req.params.token);
  if (ok) {
    res.render('public/redeemed', { coupon });
  } else {
    res.redirect(`/coupon/${req.params.token}`);
  }
}

module.exports = { index, show, revoke, showPublic, redeemPublic };
