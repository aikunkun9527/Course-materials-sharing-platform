const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');
const logger = require('./logger');

const pool = mysql.createPool({
  ...dbConfig,
  Promise: require('bluebird'),
});

// 测试连接
pool
  .getConnection()
  .then((connection) => {
    logger.info('Database connected successfully');
    connection.release();
  })
  .catch((err) => {
    logger.error('Database connection failed:', err);
  });

module.exports = pool;
