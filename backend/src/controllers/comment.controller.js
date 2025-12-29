const Comment = require('../models/comment.model');
const Discussion = require('../models/discussion.model');
const Course = require('../models/course.model');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class CommentController {
  /**
   * 获取讨论的评论列表
   */
  static async getByDiscussionId(req, res) {
    try {
      const { discussionId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await Comment.getByDiscussionId(discussionId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      // 检查用户点赞状态
      if (req.user) {
        for (const comment of result.comments) {
          comment.is_liked = await Comment.hasLiked(comment.id, req.user.id);
          for (const reply of comment.replies) {
            reply.is_liked = await Comment.hasLiked(reply.id, req.user.id);
          }
        }
      }

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get comments error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 创建评论
   */
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { discussionId, content, parentId } = req.body;

      if (!content) {
        return Response.error(res, '评论内容不能为空', 400);
      }

      // 检查讨论是否存在
      const discussion = await Discussion.findById(discussionId);
      if (!discussion) {
        return Response.notFound(res, '讨论不存在');
      }

      // 检查讨论是否被锁定
      if (discussion.is_locked) {
        return Response.error(res, '讨论已被锁定，无法评论', 400);
      }

      // 检查用户是否是课程成员
      const isMember = await Course.isMember(discussion.course_id, userId);
      if (!isMember && discussion.author_id !== userId) {
        return Response.forbidden(res, '不是课程成员');
      }

      // 如果是回复评论，检查父评论是否存在
      if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
          return Response.notFound(res, '父评论不存在');
        }
      }

      const comment = await Comment.create({
        discussion_id: discussionId,
        author_id: userId,
        content,
        parent_id: parentId,
      });

      logger.info(`Comment created: ${comment.id} by user ${userId}`);

      return Response.success(res, comment, '评论成功', 201);
    } catch (error) {
      logger.error('Create comment error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 更新评论
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      if (!content) {
        return Response.error(res, '评论内容不能为空', 400);
      }

      const comment = await Comment.findById(id);

      if (!comment) {
        return Response.notFound(res, '评论不存在');
      }

      // 只有作者可以修改
      if (comment.author_id !== userId) {
        return Response.forbidden(res, '无权限修改此评论');
      }

      const updated = await Comment.update(id, { content });

      logger.info(`Comment updated: ${id} by user ${userId}`);

      return Response.success(res, updated, '更新成功');
    } catch (error) {
      logger.error('Update comment error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 删除评论
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const comment = await Comment.findById(id);

      if (!comment) {
        return Response.notFound(res, '评论不存在');
      }

      // 只有作者或管理员可以删除
      if (comment.author_id !== userId && req.user.role !== 'admin') {
        return Response.forbidden(res, '无权限删除此评论');
      }

      await Comment.delete(id);

      logger.info(`Comment deleted: ${id} by user ${userId}`);

      return Response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('Delete comment error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 点赞/取消点赞评论
   */
  static async toggleLike(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const comment = await Comment.findById(id);
      if (!comment) {
        return Response.notFound(res, '评论不存在');
      }

      const result = await Comment.toggleLike(id, userId);

      return Response.success(res, result, result.liked ? '点赞成功' : '取消点赞');
    } catch (error) {
      logger.error('Toggle comment like error:', error);
      return Response.serverError(res, error.message);
    }
  }
}

module.exports = CommentController;
