const db = require('../database/db');
const bcrypt = require('bcrypt');

function showLogin(req, res) {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
}

async function handleLogin(req, res) {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.render('admin/login', { error: 'ユーザー名またはパスワードが正しくありません' });
  }

  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  res.redirect('/admin/dashboard');
}

function handleLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

module.exports = { showLogin, handleLogin, handleLogout };
