require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'course_sharing_platform',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 20,
  queueLimit: 0,
  waitForConnections: true,
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timezone: '+08:00',
  charset: 'utf8mb4',
};
