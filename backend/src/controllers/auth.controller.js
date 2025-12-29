const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Response = require('../utils/response');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');

class AuthController {
  /**
   * 用户注册
   */
  static async register(req, res) {
    try {
      const { email, password, username, role = 'student' } = req.body;

      // 检查邮箱是否已存在
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return Response.error(res, '邮箱已被注册', 409);
      }

      // 验证角色
      const validRoles = ['student', 'admin'];
      if (!validRoles.includes(role)) {
        return Response.error(res, '无效的角色', 400);
      }

      // 创建用户
      const user = await User.create({
        email,
        password,
        username,
        role,
      });

      // 生成Token
      const token = AuthController.generateToken(user);
      const refreshToken = AuthController.generateRefreshToken(user);

      logger.info(`User registered: ${user.id}`);

      return Response.success(res, {
        user: AuthController.sanitizeUser(user),
        token,
        refresh_token: refreshToken,
      }, '注册成功', 201);
    } catch (error) {
      logger.error('Register error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 用户登录
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // 查找用户
      const user = await User.findByEmail(email);
      if (!user) {
        return Response.error(res, '邮箱或密码错误', 401);
      }

      // 检查账号状态
      if (user.status === 0) {
        return Response.error(res, '账号已被禁用', 403);
      }

      // 验证密码
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return Response.error(res, '邮箱或密码错误', 401);
      }

      // 生成Token
      const token = AuthController.generateToken(user);
      const refreshToken = AuthController.generateRefreshToken(user);

      logger.info(`User logged in: ${user.id}`);

      return Response.success(res, {
        user: AuthController.sanitizeUser(user),
        token,
        refresh_token: refreshToken,
      }, '登录成功');
    } catch (error) {
      logger.error('Login error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取当前用户信息
   */
  static async me(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return Response.notFound(res, '用户不存在');
      }

      return Response.success(res, AuthController.sanitizeUser(user));
    } catch (error) {
      logger.error('Get current user error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 刷新Token
   */
  static async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return Response.error(res, '缺少refresh_token', 400);
      }

      // 验证refresh_token
      let decoded;
      try {
        decoded = jwt.verify(refresh_token, jwtConfig.secret);
      } catch (error) {
        return Response.unauthorized(res, 'refresh_token无效或已过期');
      }

      // 查找用户
      const user = await User.findById(decoded.id);
      if (!user) {
        return Response.notFound(res, '用户不存在');
      }

      // 生成新的Token
      const token = AuthController.generateToken(user);
      const newRefreshToken = AuthController.generateRefreshToken(user);

      return Response.success(res, {
        token,
        refresh_token: newRefreshToken,
      }, 'Token刷新成功');
    } catch (error) {
      logger.error('Refresh token error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 登出
   */
  static async logout(req, res) {
    // 实际应用中可以将token加入黑名单（使用Redis）
    // 这里仅返回成功
    logger.info(`User logged out: ${req.user.id}`);

    return Response.success(res, null, '登出成功');
  }

  /**
   * 生成访问Token
   */
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.expiresIn,
      }
    );
  }

  /**
   * 生成刷新Token
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        type: 'refresh',
      },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.refreshExpiresIn,
      }
    );
  }

  /**
   * 清理用户敏感信息
   */
  static sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = AuthController;
