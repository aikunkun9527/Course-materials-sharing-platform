const db = require('../utils/db');

class Discussion {
  /**
   * 根据ID查找讨论
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT d.*, c.title as course_title, u.username as author_name, u.avatar_url as author_avatar
       FROM discussions d
       LEFT JOIN courses c ON d.course_id = c.id
       LEFT JOIN users u ON d.author_id = u.id
       WHERE d.id = ? AND d.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  /**
   * 获取课程讨论列表
   */
  static async getByCourseId(courseId, { page = 1, limit = 20, keyword, sort = 'latest' }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE d.course_id = ? AND d.deleted_at IS NULL';
    const params = [courseId];

    if (keyword) {
      where += ' AND (d.title LIKE ? OR d.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    let orderBy = 'ORDER BY d.is_pinned DESC, d.created_at DESC';
    if (sort === 'hottest') {
      orderBy = 'ORDER BY d.is_pinned DESC, d.view_count DESC';
    }

    const [discussions] = await db.query(
      `SELECT d.*, u.username as author_name, u.avatar_url as author_avatar
       FROM discussions d
       LEFT JOIN users u ON d.author_id = u.id
       ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM discussions d ${where}`,
      params
    );

    return {
      discussions,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  /**
   * 创建讨论
   */
  static async create(data) {
    const { course_id, author_id, title, content } = data;

    const [result] = await db.query(
      'INSERT INTO discussions (course_id, author_id, title, content) VALUES (?, ?, ?, ?)',
      [course_id, author_id, title, content]
    );

    return this.findById(result.insertId);
  }

  /**
   * 更新讨论
   */
  static async update(id, data) {
    const { title, content } = data;

    await db.query(
      `UPDATE discussions
       SET title = COALESCE(?, title),
           content = COALESCE(?, content),
           updated_at = NOW()
       WHERE id = ?`,
      [title, content, id]
    );

    return this.findById(id);
  }

  /**
   * 删除讨论（软删除）
   */
  static async delete(id) {
    await db.query('UPDATE discussions SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  }

  /**
   * 增加浏览次数
   */
  static async incrementViewCount(id) {
    await db.query('UPDATE discussions SET view_count = view_count + 1 WHERE id = ?', [id]);
    return true;
  }

  /**
   * 更新评论数
   */
  static async updateCommentCount(id, delta) {
    await db.query('UPDATE discussions SET comment_count = comment_count + ? WHERE id = ?', [
      delta,
      id,
    ]);
    return true;
  }

  /**
   * 点赞/取消点赞
   */
  static async toggleLike(discussionId, userId) {
    const [existing] = await db.query(
      'SELECT * FROM likes WHERE target_type = ? AND target_id = ? AND user_id = ?',
      ['discussion', discussionId, userId]
    );

    if (existing.length > 0) {
      // 取消点赞
      await db.query(
        'DELETE FROM likes WHERE target_type = ? AND target_id = ? AND user_id = ?',
        ['discussion', discussionId, userId]
      );
      await db.query('UPDATE discussions SET like_count = like_count - 1 WHERE id = ?', [
        discussionId,
      ]);
      return { liked: false };
    }
    // 点赞
    await db.query(
      'INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
      [userId, 'discussion', discussionId]
    );
    await db.query('UPDATE discussions SET like_count = like_count + 1 WHERE id = ?', [
      discussionId,
    ]);
    return { liked: true };
  }

  /**
   * 检查用户是否已点赞
   */
  static async hasLiked(discussionId, userId) {
    if (!userId) return false;

    const [rows] = await db.query(
      'SELECT * FROM likes WHERE target_type = ? AND target_id = ? AND user_id = ?',
      ['discussion', discussionId, userId]
    );

    return rows.length > 0;
  }

  /**
   * 置顶/取消置顶
   */
  static async togglePin(id) {
    const [discussion] = await db.query('SELECT is_pinned FROM discussions WHERE id = ?', [id]);

    if (!discussion.length) {
      throw new Error('讨论不存在');
    }

    const newPinStatus = !discussion[0].is_pinned;
    await db.query('UPDATE discussions SET is_pinned = ? WHERE id = ?', [newPinStatus, id]);

    return { is_pinned: newPinStatus };
  }

  /**
   * 锁定/解锁讨论
   */
  static async toggleLock(id) {
    const [discussion] = await db.query('SELECT is_locked FROM discussions WHERE id = ?', [id]);

    if (!discussion.length) {
      throw new Error('讨论不存在');
    }

    const newLockStatus = !discussion[0].is_locked;
    await db.query('UPDATE discussions SET is_locked = ? WHERE id = ?', [newLockStatus, id]);

    return { is_locked: newLockStatus };
  }

  /**
   * 搜索讨论
   */
  static async search({ keyword, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const [discussions] = await db.query(
      `SELECT d.*, c.title as course_title, u.username as author_name
       FROM discussions d
       LEFT JOIN courses c ON d.course_id = c.id
       LEFT JOIN users u ON d.author_id = u.id
       WHERE d.deleted_at IS NULL AND (d.title LIKE ? OR d.content LIKE ?)
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [`%${keyword}%`, `%${keyword}%`, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM discussions d
       WHERE d.deleted_at IS NULL AND (d.title LIKE ? OR d.content LIKE ?)`,
      [`%${keyword}%`, `%${keyword}%`]
    );

    return {
      discussions,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }
}

module.exports = Discussion;
