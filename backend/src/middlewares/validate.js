const Joi = require('joi');
const Response = require('../utils/response');

/**
 * 验证中间件
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.path.join('.')] = detail.message;
      });

      return Response.error(res, '请求参数错误', 400, errors);
    }

    next();
  };
};

module.exports = validate;
