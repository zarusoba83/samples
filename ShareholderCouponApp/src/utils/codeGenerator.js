const crypto = require('crypto');

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateCouponCode() {
  const bytes = crypto.randomBytes(6);
  const code = Array.from(bytes).map(b => CHARS[b % CHARS.length]).join('');
  return `STKHLD-${code}`;
}

function generateAccessToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateCouponCode, generateAccessToken };
