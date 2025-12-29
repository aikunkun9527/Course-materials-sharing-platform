require('dotenv').config();

module.exports = {
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET_NAME || '',
  endpoint: process.env.OSS_ENDPOINT || 'https://oss-cn-hangzhou.aliyuncs.com',
};
