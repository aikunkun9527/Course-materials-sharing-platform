const Discussion = require('../models/discussion.model');
const Course = require('../models/course.model');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class DiscussionController {
  /**
   * 获取课程讨论列表
   */
  static async getByCourseId(req, res) {
    try {
      const { courseId } = req.params;
      const { page = 1, limit = 20, keyword, sort } = req.query;

      const result = await Discussion.getByCourseId(courseId, {
        page: parseInt(page),
        limit: parseInt(limit),
        keyword,
        sort,
      });

      // 检查用户点赞状态
      if (req.user) {
        for (const discussion of result.discussions) {
          discussion.is_liked = await Discussion.hasLiked(discussion.id, req.user.id);
        }
      }

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get discussions error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取讨论详情
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const discussion = await Discussion.findById(id);

      if (!discussion) {
        return Response.notFound(res, '讨论不存在');
      }

      // 增加浏览次数
      await Discussion.incrementViewCount(id);

      // 检查用户是否已点赞
      if (req.user) {
        discussion.is_liked = await Discussion.hasLiked(id, req.user.id);
      }

      return Response.success(res, discussion);
    } catch (error) {
      logger.error('Get discussion detail error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 创建讨论
   */
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { courseId, title, content } = req.body;

      if (!title || !content) {
        return Response.error(res, '标题和内容不能为空', 400);
      }

      // 检查课程是否存在
      const course = await Course.findById(courseId);
      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查用户是否是课程成员
      const isMember = await Course.isMember(courseId, userId);
      if (!isMember && course.creator_id !== userId) {
        return Response.forbidden(res, '不是课程成员');
      }

      const discussion = await Discussion.create({
        course_id: courseId,
        author_id: userId,
        title,
        content,
      });

      logger.info(`Discussion created: ${discussion.id} by user ${userId}`);

      return Response.success(res, discussion, '发布成功', 201);
    } catch (error) {
      logger.error('Create discussion error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 更新讨论
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, content } = req.body;

      const discussion = await Discussion.findById(id);

      if (!discussion) {
        return Response.notFound(res, '讨论不存在');
      }

      // 检查是否被锁定
      if (discussion.is_locked) {
        return Response.error(res, '讨论已被锁定', 400);
      }

      // 只有作者可以修改
      if (discussion.author_id !== userId) {
        return Response.forbidden(res, '无权限修改此讨论');
      }

      const updated = await Discussion.update(id, { title, content });

      logger.info(`Discussion updated: ${id} by user ${userId}`);

      return Response.success(res, updated, '更新成功');
    } catch (error) {
      logger.error('Update discussion error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 删除讨论
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const discussion = await Discussion.findById(id);

      if (!discussion) {
        return Response.notFound(res, '讨论不存在');
      }

      // 只有作者或管理员可以删除
      if (discussion.author_id !== userId && req.user.role !== 'admin') {
        return Response.forbidden(res, '无权限删除此讨论');
      }

      await Discussion.delete(id);

      logger.info(`Discussion deleted: ${id} by user ${userId}`);

      return Response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('Delete discussion error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 点赞/取消点赞
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const discussion = await Discussion.findById(id);
      if (!discussion) {
        return Response.notFound(res, '讨论不存在');
      }

      const result = await Discussion.toggleLike(id, userId);

      return Response.success(res, result, result.liked ? '点赞成功' : '取消点赞');
    } catch (error) {
      logger.error('Toggle like error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 置顶/取消置顶（管理员）
   */
  static async togglePin(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return Response.forbidden(res, '无权限置顶讨论');
      }

      const result = await Discussion.togglePin(id);

      logger.info(`Discussion ${id} pinned: ${result.is_pinned}`);

      return Response.success(res, result, result.is_pinned ? '置顶成功' : '取消置顶');
    } catch (error) {
      logger.error('Toggle pin error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 锁定/解锁（管理员）
   */
  static async toggleLock(req, res) {
    try {
      const { id } = req.params;
      const userRole = req.user.role;

      if (userRole !== 'admin') {
        return Response.forbidden(res, '无权限锁定讨论');
      }

      const result = await Discussion.toggleLock(id);

      logger.info(`Discussion ${id} locked: ${result.is_locked}`);

      return Response.success(res, result, result.is_locked ? '锁定成功' : '解锁成功');
    } catch (error) {
      logger.error('Toggle lock error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 搜索讨论
   */
  static async search(req, res) {
    try {
      const { keyword, page = 1, limit = 20 } = req.query;

      if (!keyword) {
        return Response.error(res, '搜索关键词不能为空', 400);
      }

      const result = await Discussion.search({
        keyword,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return Response.success(res, result);
    } catch (error) {
      logger.error('Search discussions error:', error);
      return Response.serverError(res, error.message);
    }
  }
}

module.exports = DiscussionController;
