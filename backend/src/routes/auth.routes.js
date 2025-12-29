const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimit');
const Joi = require('joi');
const validate = require('../middlewares/validate');

// 验证schema
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '邮箱格式不正确',
    'any.required': '邮箱不能为空',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码长度不能少于6位',
    'any.required': '密码不能为空',
  }),
  username: Joi.string().min(2).max(50).required().messages({
    'string.min': '用户名长度不能少于2位',
    'string.max': '用户名长度不能超过50位',
    'any.required': '用户名不能为空',
  }),
  role: Joi.string().valid('student', 'admin').optional(),
}).unknown(true); // 允许未知字段（如 confirmPassword）

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '邮箱格式不正确',
    'any.required': '邮箱不能为空',
  }),
  password: Joi.string().required().messages({
    'any.required': '密码不能为空',
  }),
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'refresh_token不能为空',
  }),
});

// 路由定义
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

module.exports = router;
