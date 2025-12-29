const db = require('../utils/db');
const bcrypt = require('bcryptjs');

class User {
  /**
   * 根据ID查找用户
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, email, username, avatar_url, role, bio, status, email_verified, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0];
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows[0];
  }

  /**
   * 创建用户
   */
  static async create(data) {
    const { email, password, username, role = 'student' } = data;

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, username, role]
    );

    return this.findById(result.insertId);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      // 首先尝试bcrypt验证
      const result = await bcrypt.compare(plainPassword, hashedPassword);
      if (result) {
        return true;
      }

      // 如果bcrypt验证失败，检查是否是明文密码（仅开发环境）
      // 如果存储的密码不是bcrypt格式（不以$2a$或$2b$开头），则进行明文比较
      if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
        return plainPassword === hashedPassword;
      }

      return false;
    } catch (error) {
      // 如果bcrypt.compare出错（比如格式错误），尝试明文比较
      return plainPassword === hashedPassword;
    }
  }

  /**
   * 更新用户信息
   */
  static async update(id, data) {
    const { username, bio, status } = data;

    await db.query(
      'UPDATE users SET username = COALESCE(?, username), bio = COALESCE(?, bio), status = COALESCE(?, status), updated_at = NOW() WHERE id = ?',
      [username, bio, status, id]
    );

    return this.findById(id);
  }

  /**
   * 更新头像
   */
  static async updateAvatar(id, avatarUrl) {
    await db.query(
      'UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?',
      [avatarUrl, id]
    );

    return this.findById(id);
  }

  /**
   * 更新密码
   */
  static async updatePassword(id, oldPassword, newPassword) {
    const user = await db.query('SELECT password FROM users WHERE id = ?', [id]);

    if (!user[0].length) {
      throw new Error('用户不存在');
    }

    const isValid = await this.verifyPassword(oldPassword, user[0][0].password);

    if (!isValid) {
      throw new Error('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?', [
      hashedPassword,
      id,
    ]);

    return true;
  }

  /**
   * 软删除用户
   */
  static async delete(id) {
    await db.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  }

  /**
   * 获取用户列表（管理员）
   */
  static async getList({ page = 1, limit = 20, role, status, keyword }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE deleted_at IS NULL';
    const params = [];

    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    if (status !== undefined) {
      where += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      where += ' AND (username LIKE ? OR email LIKE ?)';
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm);
    }

    const [users] = await db.query(
      `SELECT id, email, username, avatar_url, role, status, email_verified, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users ${where}`,
      params
    );

    return {
      users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }
}

module.exports = User;
