const rateLimit = require('express-rate-limit');

/**
 * 通用限流中间件
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 登录限流中间件
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试
  message: '登录尝试次数过多，请15分钟后再试',
  skipSuccessfulRequests: true,
});

/**
 * 上传限流中间件
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 最多20个文件
  message: '上传次数过多，请1小时后再试',
});

module.exports = {
  generalLimiter,
  loginLimiter,
  uploadLimiter,
};
