const User = require('../models/user.model');
const Response = require('../utils/response');
const StorageService = require('../services/storage.service');
const logger = require('../utils/logger');

class UserController {
  /**
   * 获取当前用户信息
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findById(userId);

      if (!user) {
        return Response.notFound(res, '用户不存在');
      }

      return Response.success(res, user);
    } catch (error) {
      logger.error('Get profile error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 更新用户信息
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { username, bio } = req.body;

      const user = await User.update(userId, {
        username,
        bio,
      });

      logger.info(`User profile updated: ${userId}`);

      return Response.success(res, user, '更新成功');
    } catch (error) {
      logger.error('Update profile error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 上传头像
   */
  static async uploadAvatar(req, res) {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return Response.error(res, '请选择头像文件', 400);
      }

      // 验证文件类型（只允许图片）
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
      if (!StorageService.validateFileType(file.originalname, allowedTypes)) {
        return Response.error(res, '只支持 JPG、PNG、GIF 格式的图片', 400);
      }

      // 验证文件大小（最大 5MB）
      const maxSize = 5 * 1024 * 1024;
      if (!StorageService.validateFileSize(file.size, maxSize)) {
        return Response.error(res, '头像大小不能超过 5MB', 400);
      }

      // 保存头像到本地存储
      const storageResult = await StorageService.saveFile('avatar', userId, file);

      // 更新用户头像
      const user = await User.updateAvatar(userId, storageResult.url);

      logger.info(`User avatar uploaded: ${userId}`);

      return Response.success(res, { avatar_url: user.avatar_url }, '上传成功');
    } catch (error) {
      logger.error('Upload avatar error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return Response.error(res, '请提供原密码和新密码', 400);
      }

      if (new_password.length < 6) {
        return Response.error(res, '新密码长度不能少于6位', 400);
      }

      await User.updatePassword(userId, old_password, new_password);

      logger.info(`User password changed: ${userId}`);

      return Response.success(res, null, '密码修改成功');
    } catch (error) {
      logger.error('Change password error:', error);

      if (error.message === '原密码错误') {
        return Response.error(res, error.message, 400);
      }

      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取用户详情（公开）
   */
  static async getPublicProfile(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return Response.notFound(res, '用户不存在');
      }

      // 只返回公开信息
      const publicUser = {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: user.role,
        created_at: user.created_at,
      };

      return Response.success(res, publicUser);
    } catch (error) {
      logger.error('Get public profile error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取用户列表（管理员）
   */
  static async getList(req, res) {
    try {
      const { page = 1, limit = 20, role, status, keyword } = req.query;

      const result = await User.getList({
        page: parseInt(page),
        limit: parseInt(limit),
        role,
        status: status !== undefined ? parseInt(status) : undefined,
        keyword,
      });

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get user list error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 禁用/启用用户（管理员）
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (status !== 0 && status !== 1) {
        return Response.error(res, '无效的状态值', 400);
      }

      await User.update(id, { status });

      logger.info(`User status updated: ${id} -> ${status}`);

      return Response.success(res, null, '更新成功');
    } catch (error) {
      logger.error('Update user status error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 删除用户（管理员）
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;

      // 不允许删除自己
      if (parseInt(id) === req.user.id) {
        return Response.error(res, '不能删除自己', 400);
      }

      await User.delete(id);

      logger.info(`User deleted: ${id}`);

      return Response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('Delete user error:', error);
      return Response.serverError(res, error.message);
    }
  }
}

module.exports = UserController;
