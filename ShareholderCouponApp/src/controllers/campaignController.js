const campaignService = require('../services/campaignService');
const couponService = require('../services/couponService');

function index(req, res) {
  const campaigns = campaignService.getAllCampaigns();
  res.render('admin/campaigns/index', {
    campaigns,
    flash: req.session.flash || null,
  });
  delete req.session.flash;
}

function showNew(req, res) {
  res.render('admin/campaigns/new', { error: null, values: {} });
}

function create(req, res) {
  const { name, description, discount_value, discount_type, valid_from, valid_until } = req.body;
  try {
    const id = campaignService.createCampaign({ name, description, discount_value, discount_type, valid_from, valid_until });
    req.session.flash = { type: 'success', message: 'キャンペーンを作成しました' };
    res.redirect('/admin/campaigns');
  } catch (e) {
    res.render('admin/campaigns/new', { error: e.message, values: req.body });
  }
}

function issueAll(req, res) {
  try {
    const result = couponService.issueCouponsForCampaign(req.params.id);
    req.session.flash = { type: 'success', message: `${result.issued}件のクーポンを発行しました` };
  } catch (e) {
    req.session.flash = { type: 'danger', message: e.message };
  }
  res.redirect('/admin/campaigns');
}

function destroy(req, res) {
  campaignService.deleteCampaign(req.params.id);
  req.session.flash = { type: 'success', message: 'キャンペーンを削除しました' };
  res.redirect('/admin/campaigns');
}

module.exports = { index, showNew, create, issueAll, destroy };
