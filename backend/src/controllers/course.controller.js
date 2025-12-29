const Course = require('../models/course.model');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class CourseController {
  /**
   * 获取课程列表
   */
  static async getList(req, res) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, category, keyword, status } = req.query;

      const result = await Course.getList({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        keyword,
        status,
      });

      // 如果用户已登录，检查用户对每个课程的加入状态
      if (userId && result.courses) {
        for (const course of result.courses) {
          const isMember = await Course.isMember(course.id, userId);
          course.is_enrolled = !!isMember; // 确保返回布尔值
        }
      }

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get course list error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取课程详情
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const course = await Course.findById(id);

      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查用户是否已加入课程
      let isEnrolled = false;
      let enrolledAt = null;

      if (userId) {
        isEnrolled = await Course.isMember(id, userId);
        if (isEnrolled) {
          const [enrollment] = await require('../utils/db').query(
            'SELECT enrolled_at FROM enrollments WHERE course_id = ? AND user_id = ?',
            [id, userId]
          );
          enrolledAt = enrollment[0]?.enrolled_at;
        }
      }

      const courseData = {
        ...course,
        is_enrolled: isEnrolled,
        enrolled_at: enrolledAt,
      };

      return Response.success(res, courseData);
    } catch (error) {
      logger.error('Get course detail error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 创建课程（仅教师）
   */
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, category, cover_url, max_students } = req.body;

      if (!title) {
        return Response.error(res, '课程标题不能为空', 400);
      }

      const course = await Course.create({
        title,
        description,
        creator_id: userId,
        category,
        cover_url,
        max_students,
      });

      logger.info(`Course created: ${course.id} by user ${userId}`);

      return Response.success(res, course, '课程创建成功', 201);
    } catch (error) {
      logger.error('Create course error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 更新课程
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const course = await Course.findById(id);

      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查权限：只有课程创建者或管理员可以更新
      if (course.creator_id !== userId && userRole !== 'admin') {
        return Response.forbidden(res, '无权限修改此课程');
      }

      const updatedCourse = await Course.update(id, req.body);

      logger.info(`Course updated: ${id} by user ${userId}`);

      return Response.success(res, updatedCourse, '更新成功');
    } catch (error) {
      logger.error('Update course error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 删除课程
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const course = await Course.findById(id);

      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查权限：只有课程创建者或管理员可以删除
      if (course.creator_id !== userId && userRole !== 'admin') {
        return Response.forbidden(res, '无权限删除此课程');
      }

      await Course.delete(id);

      logger.info(`Course deleted: ${id} by user ${userId}`);

      return Response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('Delete course error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 加入课程
   */
  static async enroll(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 检查是否已加入
      const isMember = await Course.isMember(id, userId);
      if (isMember) {
        return Response.error(res, '已经是课程成员', 409);
      }

      await Course.enroll(id, userId, 'student');

      logger.info(`User ${userId} enrolled in course ${id}`);

      return Response.success(res, null, '加入课程成功');
    } catch (error) {
      logger.error('Enroll course error:', error);

      if (error.message === '课程不存在') {
        return Response.notFound(res, error.message);
      }

      if (error.message === '课程人数已满') {
        return Response.error(res, error.message, 400);
      }

      return Response.serverError(res, error.message);
    }
  }

  /**
   * 退出课程
   */
  static async unenroll(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // 检查是否是成员
      const isMember = await Course.isMember(id, userId);
      if (!isMember) {
        return Response.error(res, '未加入该课程', 400);
      }

      const course = await Course.findById(id);

      // 创建者不能退出自己的课程
      if (course.creator_id === userId) {
        return Response.error(res, '创建者不能退出自己的课程', 400);
      }

      await Course.unenroll(id, userId);

      logger.info(`User ${userId} unenrolled from course ${id}`);

      return Response.success(res, null, '已退出课程');
    } catch (error) {
      logger.error('Unenroll course error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取课程成员列表
   */
  static async getMembers(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, role } = req.query;

      const course = await Course.findById(id);
      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      const result = await Course.getMembers(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        role,
      });

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get course members error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取用户的课程列表
   */
  static async getMyCourses(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await Course.getUserCourses(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      logger.info(`Get my courses for user ${userId}:`, JSON.stringify(result));

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get my courses error:', error);
      return Response.serverError(res, error.message);
    }
  }
}

module.exports = CourseController;
