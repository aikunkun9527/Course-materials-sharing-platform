/**
 * 统一响应格式
 */
class Response {
  /**
   * 成功响应
   */
  static success(res, data = null, message = '操作成功', code = 200) {
    return res.status(code).json({
      success: true,
      code,
      message,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 错误响应
   */
  static error(res, message = '操作失败', code = 400, errors = null) {
    return res.status(code).json({
      success: false,
      code,
      message,
      errors,
      timestamp: Date.now(),
    });
  }

  /**
   * 404响应
   */
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, 404);
  }

  /**
   * 401响应
   */
  static unauthorized(res, message = '未认证') {
    return this.error(res, message, 401);
  }

  /**
   * 403响应
   */
  static forbidden(res, message = '无权限访问') {
    return this.error(res, message, 403);
  }

  /**
   * 500响应
   */
  static serverError(res, message = '服务器内部错误') {
    return this.error(res, message, 500);
  }
}

module.exports = Response;
