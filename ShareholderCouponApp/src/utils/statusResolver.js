function resolveStatus(coupon, campaign) {
  if (coupon.status === 'used') return 'used';
  const now = new Date();
  if (campaign.valid_until && new Date(campaign.valid_until) < now) return 'expired';
  if (campaign.valid_from && new Date(campaign.valid_from) > now) return 'not_yet';
  return 'unused';
}

module.exports = { resolveStatus };
