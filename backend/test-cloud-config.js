/**
 * 云服务配置测试脚本
 * 用于测试RDS数据库和OSS配置是否正确
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const OSS = require('ali-oss');

const tests = {
  database: null,
  oss: null
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

// ==================== 测试1: 数据库连接 ====================
async function testDatabase() {
  logSection('测试 1/2: 数据库连接');

  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
  };

  log(`数据库地址: ${config.host}:${config.port}`, 'yellow');
  log(`数据库名称: ${config.database}`, 'yellow');
  log(`用户名: ${config.user}`, 'yellow');

  try {
    log('\n正在连接数据库...', 'yellow');

    const connection = await mysql.createConnection(config);

    log('✓ 数据库连接成功！', 'green');

    // 测试查询
    log('\n执行测试查询...', 'yellow');
    const [rows] = await connection.execute('SELECT VERSION() as version, NOW() as time');

    log(`✓ 查询成功！`, 'green');
    log(`  MySQL版本: ${rows[0].version}`, 'reset');
    log(`  当前时间: ${rows[0].time}`, 'reset');

    // 检查表是否存在
    log('\n检查数据库表...', 'yellow');
    const [tables] = await connection.execute('SHOW TABLES');

    if (tables.length === 0) {
      log('⚠ 数据库中还没有表，需要导入表结构', 'yellow');
      log('  请运行 docs/02-数据库设计.md 中的建表SQL', 'yellow');
    } else {
      log(`✓ 找到 ${tables.length} 张表:`, 'green');
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        log(`  ${index + 1}. ${tableName}`, 'reset');
      });
    }

    await connection.end();
    tests.database = true;
    return true;

  } catch (error) {
    log('✗ 数据库连接失败！', 'red');
    log(`  错误信息: ${error.message}`, 'red');

    if (error.code === 'ETIMEDOUT') {
      log('\n可能的原因:', 'yellow');
      log('  1. 数据库地址不正确');
      log('  2. 网络无法连接到阿里云RDS');
      log('  3. 数据库白名单未配置');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('\n可能的原因:', 'yellow');
      log('  1. 用户名或密码错误');
      log('  2. 用户没有权限访问该数据库');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      log('\n可能的原因:', 'yellow');
      log('  1. 数据库不存在，请先创建数据库');
      log(`  2. 在RDS控制台创建数据库: ${config.database}`);
    }

    tests.database = false;
    return false;
  }
}

// ==================== 测试2: OSS连接 ====================
async function testOSS() {
  logSection('测试 2/2: OSS对象存储');

  const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET_NAME
  });

  log(`OSS区域: ${process.env.OSS_REGION}`, 'yellow');
  log(`Bucket名称: ${process.env.OSS_BUCKET_NAME}`, 'yellow');
  log(`Endpoint: ${process.env.OSS_ENDPOINT}`, 'yellow');

  try {
    log('\n正在连接OSS...', 'yellow');

    // 测试1: 检查bucket是否存在
    const result = await client.getBucketInfo();

    log('✓ OSS连接成功！', 'green');
    log(`  Bucket所在区域: ${result.bucket.Location}`, 'reset');
    log(`  Bucket创建时间: ${result.bucket.CreationDate}`, 'reset');
    log(`  存储类型: ${result.bucket.StorageClass}`, 'reset');

    // 测试2: 列举文件（测试权限）
    log('\n测试列举文件...', 'yellow');
    const listResult = await client.list();

    if (listResult.objects && listResult.objects.length > 0) {
      log(`✓ Bucket中有 ${listResult.objects.length} 个文件:`, 'green');
      listResult.objects.slice(0, 5).forEach((obj, index) => {
        log(`  ${index + 1}. ${obj.name} (${(obj.size / 1024).toFixed(2)} KB)`, 'reset');
      });
      if (listResult.objects.length > 5) {
        log(`  ... 还有 ${listResult.objects.length - 5} 个文件`, 'reset');
      }
    } else {
      log('✓ Bucket是空的，可以正常使用', 'green');
    }

    // 测试3: 上传测试文件（可选）
    log('\n是否要上传测试文件？(测试上传功能)', 'yellow');
    log('  输入 y 继续，其他键跳过...', 'reset');

    // 注意：这里不实际上传，只是告诉用户如何测试

    tests.oss = true;
    return true;

  } catch (error) {
    log('✗ OSS连接失败！', 'red');
    log(`  错误信息: ${error.message}`, 'red');

    if (error.code === 'NoSuchBucket') {
      log('\n可能的原因:', 'yellow');
      log('  1. Bucket不存在');
      log('  2. Bucket名称错误，请检查: ' + process.env.OSS_BUCKET_NAME);
      log('  3. 请到OSS控制台确认Bucket是否存在');
    } else if (error.code === 'AccessDenied') {
      log('\n可能的原因:', 'yellow');
      log('  1. AccessKeyID或AccessKeySecret错误');
      log('  2. RAM用户没有该Bucket的权限');
      log('  3. 请到RAM控制台检查用户权限');
    } else if (error.code === 'ENOTFOUND') {
      log('\n可能的原因:', 'yellow');
      log('  1. OSS区域配置错误');
      log('  2. 网络连接问题');
      log('  3. 请检查OSS_REGION配置');
    }

    tests.oss = false;
    return false;
  }
}

// ==================== 主测试流程 ====================
async function main() {
  console.log('\n' + '█'.repeat(60));
  log('  阿里云服务配置测试工具', 'blue');
  console.log('█'.repeat(60));

  log('\n正在读取 .env 配置...', 'yellow');

  // 检查必需的环境变量
  const requiredEnvs = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'OSS_REGION', 'OSS_ACCESS_KEY_ID', 'OSS_ACCESS_KEY_SECRET', 'OSS_BUCKET_NAME'
  ];

  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    log('\n✗ 缺少必需的环境变量:', 'red');
    missingEnvs.forEach(env => log(`  - ${env}`, 'red'));
    log('\n请检查 .env 文件是否正确配置', 'yellow');
    process.exit(1);
  }

  log('✓ 配置文件检查通过\n', 'green');

  // 执行测试
  await testDatabase();
  await testOSS();

  // 输出测试结果
  logSection('测试结果汇总');

  const allPassed = tests.database && tests.oss;

  log(`数据库连接: ${tests.database ? '✓ 通过' : '✗ 失败'}`, tests.database ? 'green' : 'red');
  log(`OSS连接:     ${tests.oss ? '✓ 通过' : '✗ 失败'}`, tests.oss ? 'green' : 'red');

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    log('🎉 所有测试通过！配置正确，可以启动后端服务了！', 'green');
    log('\n运行以下命令启动服务:', 'blue');
    log('  npm run dev', 'yellow');
  } else {
    log('⚠ 部分测试失败，请根据上面的错误提示修复配置', 'yellow');
    log('\n修复后再次运行此测试:', 'blue');
    log('  node test-cloud-config.js', 'yellow');
  }

  console.log('');
}

// 运行测试
main().catch(error => {
  log('\n✗ 测试过程中发生错误:', 'red');
  log(error.message, 'red');
  console.log('');
  process.exit(1);
});
