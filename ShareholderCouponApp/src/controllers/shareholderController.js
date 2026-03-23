const shareholderService = require('../services/shareholderService');

function index(req, res) {
  const { page = 1, search = '' } = req.query;
  const data = shareholderService.getAllShareholders({ page: parseInt(page), search });
  res.render('admin/shareholders/index', {
    ...data,
    search,
    flash: req.session.flash || null,
  });
  delete req.session.flash;
}

function showNew(req, res) {
  res.render('admin/shareholders/new', { error: null, values: {} });
}

function create(req, res) {
  const { name, email, shareholder_number, shares_count } = req.body;
  try {
    shareholderService.createShareholder({ name, email, shareholder_number, shares_count });
    req.session.flash = { type: 'success', message: '株主を登録しました' };
    res.redirect('/admin/shareholders');
  } catch (e) {
    const msg = e.message.includes('UNIQUE') ? '株主番号またはメールアドレスが重複しています' : e.message;
    res.render('admin/shareholders/new', { error: msg, values: req.body });
  }
}

function show(req, res) {
  const shareholder = shareholderService.getShareholderById(req.params.id);
  if (!shareholder) return res.status(404).render('error', { message: '株主が見つかりません' });
  const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
  res.render('admin/shareholders/show', { shareholder, baseUrl });
}

function showEdit(req, res) {
  const shareholder = shareholderService.getShareholderById(req.params.id);
  if (!shareholder) return res.status(404).render('error', { message: '株主が見つかりません' });
  res.render('admin/shareholders/edit', { error: null, values: shareholder });
}

function update(req, res) {
  const { name, email, shareholder_number, shares_count } = req.body;
  try {
    shareholderService.updateShareholder(req.params.id, { name, email, shareholder_number, shares_count });
    req.session.flash = { type: 'success', message: '株主情報を更新しました' };
    res.redirect(`/admin/shareholders/${req.params.id}`);
  } catch (e) {
    const msg = e.message.includes('UNIQUE') ? '株主番号またはメールアドレスが重複しています' : e.message;
    res.render('admin/shareholders/edit', { error: msg, values: req.body });
  }
}

function destroy(req, res) {
  shareholderService.deleteShareholder(req.params.id);
  req.session.flash = { type: 'success', message: '株主を削除しました' };
  res.redirect('/admin/shareholders');
}

module.exports = { index, showNew, create, show, showEdit, update, destroy };
