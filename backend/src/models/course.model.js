const db = require('../utils/db');

class Course {
  /**
   * 根据ID查找课程
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT c.*, u.username as creator_name, u.avatar_url as creator_avatar
       FROM courses c
       LEFT JOIN users u ON c.creator_id = u.id
       WHERE c.id = ? AND c.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  /**
   * 获取课程列表
   */
  static async getList({ page = 1, limit = 20, category, keyword, status = 'active' }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE c.deleted_at IS NULL';
    const params = [];

    if (status) {
      where += ' AND c.status = ?';
      params.push(status);
    }

    if (category) {
      where += ' AND c.category = ?';
      params.push(category);
    }

    if (keyword) {
      where += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [courses] = await db.query(
      `SELECT c.*, u.username as creator_name, u.avatar_url as creator_avatar,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as enrollment_count,
              (SELECT COUNT(*) FROM materials WHERE course_id = c.id AND deleted_at IS NULL) as material_count,
              (SELECT COUNT(*) FROM discussions WHERE course_id = c.id AND deleted_at IS NULL) as discussion_count
       FROM courses c
       LEFT JOIN users u ON c.creator_id = u.id
       ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM courses c ${where}`,
      params
    );

    return {
      courses,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  /**
   * 创建课程
   */
  static async create(data) {
    const { title, description, creator_id, category, cover_url, max_students } = data;

    const [result] = await db.query(
      `INSERT INTO courses (title, description, creator_id, category, cover_url, max_students)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, creator_id, category, cover_url, max_students]
    );

    return this.findById(result.insertId);
  }

  /**
   * 更新课程
   */
  static async update(id, data) {
    const { title, description, category, cover_url, max_students, status } = data;

    await db.query(
      `UPDATE courses
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           cover_url = COALESCE(?, cover_url),
           max_students = COALESCE(?, max_students),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ?`,
      [title, description, category, cover_url, max_students, status, id]
    );

    return this.findById(id);
  }

  /**
   * 删除课程（软删除）
   */
  static async delete(id) {
    await db.query('UPDATE courses SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  }

  /**
   * 更新学生数
   */
  static async updateStudentCount(id, delta) {
    await db.query(
      'UPDATE courses SET current_students = current_students + ? WHERE id = ?',
      [delta, id]
    );
  }

  /**
   * 检查用户是否是课程成员
   */
  static async isMember(courseId, userId) {
    const [rows] = await db.query(
      'SELECT * FROM enrollments WHERE course_id = ? AND user_id = ?',
      [courseId, userId]
    );
    return rows.length > 0;
  }

  /**
   * 加入课程
   */
  static async enroll(courseId, userId, role = 'student') {
    const course = await this.findById(courseId);

    if (!course) {
      throw new Error('课程不存在');
    }

    if (course.max_students && course.current_students >= course.max_students) {
      throw new Error('课程人数已满');
    }

    await db.query(
      'INSERT INTO enrollments (user_id, course_id, role) VALUES (?, ?, ?)',
      [userId, courseId, role]
    );

    await this.updateStudentCount(courseId, 1);

    return true;
  }

  /**
   * 退出课程
   */
  static async unenroll(courseId, userId) {
    await db.query('DELETE FROM enrollments WHERE course_id = ? AND user_id = ?', [
      courseId,
      userId,
    ]);

    await this.updateStudentCount(courseId, -1);

    return true;
  }

  /**
   * 获取课程成员列表
   */
  static async getMembers(courseId, { page = 1, limit = 20, role }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE e.course_id = ?';
    const params = [courseId];

    if (role) {
      where += ' AND e.role = ?';
      params.push(role);
    }

    const [members] = await db.query(
      `SELECT e.*, u.username, u.avatar_url, u.email
       FROM enrollments e
       LEFT JOIN users u ON e.user_id = u.id
       ${where} ORDER BY e.enrolled_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM enrollments e ${where}`,
      params
    );

    return {
      members,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  /**
   * 获取用户的课程列表（包括加入的和创建的）
   */
  static async getUserCourses(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    // 查询用户加入的课程和创建的课程，使用 UNION 合并
    const [courses] = await db.query(
      `SELECT * FROM (
        -- 用户加入的课程
        SELECT c.*,
               u.username as creator_name,
               u.avatar_url as creator_avatar,
               e.role as user_role,
               e.enrolled_at,
               'enrolled' as source_type,
               (SELECT COUNT(*) FROM materials WHERE course_id = c.id AND deleted_at IS NULL) as material_count,
               (SELECT COUNT(*) FROM discussions WHERE course_id = c.id AND deleted_at IS NULL) as discussion_count
        FROM enrollments e
        LEFT JOIN courses c ON e.course_id = c.id
        LEFT JOIN users u ON c.creator_id = u.id
        WHERE e.user_id = ? AND c.deleted_at IS NULL AND c.id IS NOT NULL

        UNION

        -- 用户创建的课程
        SELECT c.*,
               u.username as creator_name,
               u.avatar_url as creator_avatar,
               'teacher' as user_role,
               c.created_at as enrolled_at,
               'created' as source_type,
               (SELECT COUNT(*) FROM materials WHERE course_id = c.id AND deleted_at IS NULL) as material_count,
               (SELECT COUNT(*) FROM discussions WHERE course_id = c.id AND deleted_at IS NULL) as discussion_count
        FROM courses c
        LEFT JOIN users u ON c.creator_id = u.id
        WHERE c.creator_id = ? AND c.deleted_at IS NULL
      ) as combined_courses
      ORDER BY enrolled_at DESC
      LIMIT ? OFFSET ?`,
      [userId, userId, limit, offset]
    );

    // 计算总数（去重后的课程数量）
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT id) as total FROM (
        SELECT c.id FROM enrollments e
        LEFT JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ? AND c.deleted_at IS NULL AND c.id IS NOT NULL

        UNION

        SELECT c.id FROM courses c
        WHERE c.creator_id = ? AND c.deleted_at IS NULL
      ) as combined`,
      [userId, userId]
    );

    return {
      courses,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }
}

module.exports = Course;
