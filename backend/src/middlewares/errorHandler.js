const logger = require('../utils/logger');
const Response = require('../utils/response');

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // JWT错误
  if (err.name === 'UnauthorizedError') {
    return Response.unauthorized(res, 'Token无效');
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return Response.error(res, err.message, 400, err.errors);
  }

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return Response.error(res, '数据已存在', 409);
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return Response.error(res, '关联数据不存在', 400);
  }

  // 默认错误
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  return Response.error(res, message, statusCode);
};

/**
 * 404处理中间件
 */
const notFound = (req, res, next) => {
  return Response.notFound(res, `路径 ${req.originalUrl} 不存在`);
};

module.exports = {
  errorHandler,
  notFound,
};
