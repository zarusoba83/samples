const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const couponController = require('../controllers/couponController');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 30,
  message: 'アクセス回数が多すぎます。しばらくしてからお試しください。',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:token', limiter, couponController.showPublic);
router.post('/:token/redeem', limiter, couponController.redeemPublic);

module.exports = router;
