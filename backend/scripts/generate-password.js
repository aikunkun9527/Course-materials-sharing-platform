/**
 * 生成bcrypt密码哈希
 * 用于生成管理员账号的密码哈希
 */

const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }

  console.log('========================================');
  console.log('密码哈希生成成功！');
  console.log('========================================');
  console.log('');
  console.log('原始密码:', password);
  console.log('');
  console.log('Bcrypt哈希值:');
  console.log(hash);
  console.log('');
  console.log('SQL INSERT语句:');
  console.log(`INSERT INTO users (email, password, username, role, email_verified, status)`);
  console.log(`VALUES ('admin@course.com', '${hash}', '系统管理员', 'admin', TRUE, 1);`);
  console.log('');
  console.log('========================================');
  console.log('注意: 请将上面的哈希值复制到SQL脚本中使用');
  console.log('========================================');
});
