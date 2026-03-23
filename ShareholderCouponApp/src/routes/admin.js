const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/adminAuth');
const dashboardController = require('../controllers/dashboardController');
const shareholderController = require('../controllers/shareholderController');
const campaignController = require('../controllers/campaignController');
const couponController = require('../controllers/couponController');

router.use(requireAdmin);

// ダッシュボード
router.get('/dashboard', dashboardController.show);
router.get('/', (req, res) => res.redirect('/admin/dashboard'));

// 株主管理
router.get('/shareholders', shareholderController.index);
router.get('/shareholders/new', shareholderController.showNew);
router.post('/shareholders', shareholderController.create);
router.get('/shareholders/:id', shareholderController.show);
router.get('/shareholders/:id/edit', shareholderController.showEdit);
router.post('/shareholders/:id', shareholderController.update);
router.post('/shareholders/:id/delete', shareholderController.destroy);

// キャンペーン管理
router.get('/campaigns', campaignController.index);
router.get('/campaigns/new', campaignController.showNew);
router.post('/campaigns', campaignController.create);
router.post('/campaigns/:id/issue', campaignController.issueAll);
router.post('/campaigns/:id/delete', campaignController.destroy);

// クーポン管理
router.get('/coupons', couponController.index);
router.get('/coupons/:id', couponController.show);
router.post('/coupons/:id/revoke', couponController.revoke);

module.exports = router;
