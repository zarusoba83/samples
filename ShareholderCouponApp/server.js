require('dotenv').config();
require('./src/database/db'); // DBの初期化

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`株主優待クーポン管理アプリが起動しました`);
  console.log(`http://localhost:${PORT}`);
  console.log(`管理画面: http://localhost:${PORT}/admin`);
});
