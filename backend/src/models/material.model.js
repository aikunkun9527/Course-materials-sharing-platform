const db = require('../utils/db');

class Material {
  /**
   * 根据ID查找资料
   */
  static async findById(id) {
    const [rows] = await db.query(
      `SELECT m.*, c.title as course_title, u.username as uploader_name
       FROM materials m
       LEFT JOIN courses c ON m.course_id = c.id
       LEFT JOIN users u ON m.uploader_id = u.id
       WHERE m.id = ? AND m.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  }

  /**
   * 获取课程资料列表
   */
  static async getByCourseId(courseId, { page = 1, limit = 20, type, keyword, sort = 'latest' }) {
    const offset = (page - 1) * limit;
    let where = 'WHERE m.course_id = ? AND m.deleted_at IS NULL';
    const params = [courseId];

    if (type) {
      where += ' AND m.file_type = ?';
      params.push(type);
    }

    if (keyword) {
      where += ' AND (m.title LIKE ? OR m.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    let orderBy = 'ORDER BY m.created_at DESC';
    if (sort === 'hottest') {
      orderBy = 'ORDER BY m.download_count DESC';
    }

    const [materials] = await db.query(
      `SELECT m.*, u.username as uploader_name
       FROM materials m
       LEFT JOIN users u ON m.uploader_id = u.id
       ${where} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM materials m ${where}`,
      params
    );

    return {
      materials,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  /**
   * 创建资料
   */
  static async create(data) {
    const {
      course_id,
      uploader_id,
      title,
      description,
      file_url,
      file_name,
      file_size,
      file_type,
      file_extension,
      is_public = true,
    } = data;

    const [result] = await db.query(
      `INSERT INTO materials (course_id, uploader_id, title, description, file_url, file_name, file_size, file_type, file_extension, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        uploader_id,
        title,
        description,
        file_url,
        file_name,
        file_size,
        file_type,
        file_extension,
        is_public,
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * 更新资料
   */
  static async update(id, data) {
    const { title, description, is_public } = data;

    await db.query(
      `UPDATE materials
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           is_public = COALESCE(?, is_public),
           updated_at = NOW()
       WHERE id = ?`,
      [title, description, is_public, id]
    );

    return this.findById(id);
  }

  /**
   * 删除资料（软删除）
   */
  static async delete(id) {
    await db.query('UPDATE materials SET deleted_at = NOW() WHERE id = ?', [id]);
    return true;
  }

  /**
   * 增加下载次数
   */
  static async incrementDownloadCount(id) {
    await db.query('UPDATE materials SET download_count = download_count + 1 WHERE id = ?', [
      id,
    ]);
    return true;
  }

  /**
   * 记录下载日志
   */
  static async logDownload(data) {
    const { material_id, user_id, ip_address, user_agent } = data;

    await db.query(
      `INSERT INTO download_logs (material_id, user_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?)`,
      [material_id, user_id, ip_address, user_agent]
    );

    return true;
  }

  /**
   * 获取用户上传的资料
   */
  static async getByUploader(uploaderId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const [materials] = await db.query(
      `SELECT m.*, c.title as course_title
       FROM materials m
       LEFT JOIN courses c ON m.course_id = c.id
       WHERE m.uploader_id = ? AND m.deleted_at IS NULL
       ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [uploaderId, limit, offset]
    );

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM materials WHERE uploader_id = ? AND deleted_at IS NULL',
      [uploaderId]
    );

    return {
      materials,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }

  /**
   * 搜索资料
   */
  static async search({ keyword, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const [materials] = await db.query(
      `SELECT m.*, c.title as course_title, u.username as uploader_name
       FROM materials m
       LEFT JOIN courses c ON m.course_id = c.id
       LEFT JOIN users u ON m.uploader_id = u.id
       WHERE m.deleted_at IS NULL AND (m.title LIKE ? OR m.description LIKE ?)
       ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [`%${keyword}%`, `%${keyword}%`, limit, offset]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM materials m
       WHERE m.deleted_at IS NULL AND (m.title LIKE ? OR m.description LIKE ?)`,
      [`%${keyword}%`, `%${keyword}%`]
    );

    return {
      materials,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  }
}

module.exports = Material;
