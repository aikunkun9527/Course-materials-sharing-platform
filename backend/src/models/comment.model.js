const db = require('../utils/db');

class Comment {
  /**
   * 根据ID查找评论
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT c.*, d.title as discussion_title, u.username as author_name, u.avatar_url as author_avatar
       FROM comments c
       LEFT JOIN discussions d ON c.discussion_id = d.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.id = ? AND c.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  /**
   * 获取讨论的评论列表
   */
  static async getByDiscussionId(discussionId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    // 获取顶级评论
    const [comments] = await db.query(
      `SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.discussion_id = ? AND c.parent_id IS NULL AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC LIMIT ? OFFSET ?`,
      [discussionId, limit, offset]
    );

    // 获取回复
    for (const comment of comments) {
      const [replies] = await db.query(
        `SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
         FROM comments c
         LEFT JOIN users u ON c.author_id = u.id
         WHERE c.parent_id = ? AND c.deleted_at IS NULL
         ORDER BY c.created_at ASC`,
        [comment.id]
      );
      comment.replies = replies;
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM comments WHERE discussion_id = ? AND parent_id IS NULL AND deleted_at IS NULL`,
      [discussionId]
    );

    return {
      comments,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  /**
   * 创建评论
   */
  static async create(data) {
    const { discussion_id, author_id, content, parent_id } = data;

    const [result] = await db.query(
      'INSERT INTO comments (discussion_id, author_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [discussion_id, author_id, content, parent_id || null]
    );

    // 更新讨论的评论数
    const Discussion = require('./discussion.model');
    await Discussion.updateCommentCount(discussion_id, 1);

    return this.findById(result.insertId);
  }

  /**
   * 更新评论
   */
  static async update(id, data) {
    const { content } = data;

    await db.query(
      `UPDATE comments
       SET content = ?, updated_at = NOW()
       WHERE id = ?`,
      [content, id]
    );

    return this.findById(id);
  }

  /**
   * 删除评论（软删除）
   */
  static async delete(id) {
    const comment = await this.findById(id);

    if (!comment) {
      throw new Error('评论不存在');
    }

    await db.query('UPDATE comments SET deleted_at = NOW() WHERE id = ?', [id]);

    // 更新讨论的评论数
    const Discussion = require('./discussion.model');
    await Discussion.updateCommentCount(comment.discussion_id, -1);

    return true;
  }

  /**
   * 点赞/取消点赞评论
   */
  static async toggleLike(commentId, userId) {
    const [existing] = await db.query(
      'SELECT * FROM likes WHERE target_type = ? AND target_id = ? AND user_id = ?',
      ['comment', commentId, userId]
    );

    if (existing.length > 0) {
      // 取消点赞
      await db.query(
        'DELETE FROM likes WHERE target_type = ? AND target_id = ? AND user_id = ?',
        ['comment', commentId, userId]
      );
      await db.query('UPDATE comments SET like_count = like_count - 1 WHERE id = ?', [commentId]);
      return { liked: false };
    }
    // 点赞
    await db.query(
      'INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)',
      [userId, 'comment', commentId]
    );
    await db.query('UPDATE comments SET like_count = like_count + 1 WHERE id = ?', [commentId]);
    return { liked: true };
  }

  /**
   * 检查用户是否已点赞评论
   */
  static async hasLiked(commentId, userId) {
    if (!userId) return false;

    const [rows] = await db.query(
      'SELECT * FROM likes WHERE target_type = ? AND target_id = ? AND user_id = ?',
      ['comment', commentId, userId]
    );

    return rows.length > 0;
  }

  /**
   * 获取用户的所有评论
   */
  static async getByUser(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const [comments] = await db.query(
      `SELECT c.*, d.title as discussion_title
       FROM comments c
       LEFT JOIN discussions d ON c.discussion_id = d.id
       WHERE c.author_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM comments WHERE author_id = ? AND deleted_at IS NULL',
      [userId]
    );

    return {
      comments,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }
}

module.exports = Comment;
