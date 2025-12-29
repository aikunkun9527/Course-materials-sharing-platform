const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * JWT认证中间件
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.unauthorized(res, '未提供认证Token');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return Response.unauthorized(res, 'Token已过期');
      }
      return Response.unauthorized(res, 'Token无效');
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return Response.serverError(res, '认证失败');
  }
};

/**
 * 可选JWT认证中间件 - 如果提供了token则验证，否则继续
 */
const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
      } catch (error) {
        // Token无效，但不阻止请求继续
        logger.warn('Optional auth token invalid:', error.message);
      }
    }

    // 无论是否有有效token，都继续处理请求
    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    // 不阻止请求继续
    next();
  }
};

/**
 * 授权中间件 - 检查用户角色
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return Response.unauthorized(res, '未认证');
    }

    if (!roles.includes(req.user.role)) {
      return Response.forbidden(res, '无权限访问');
    }

    next();
  };
};

module.exports = {
  authenticate,
  authenticateOptional,
  authorize,
};
