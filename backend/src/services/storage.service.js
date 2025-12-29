const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const materialsDir = path.join(uploadDir, 'materials');
const avatarsDir = path.join(uploadDir, 'avatars');
const coversDir = path.join(uploadDir, 'covers');

[uploadDir, materialsDir, avatarsDir, coversDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
});

class StorageService {
  /**
   * 生成文件路径
   */
  static generateFilePath(type, userId, fileName) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const ext = fileName.split('.').pop();

    switch (type) {
      case 'avatar':
        return {
          relative: `avatars/${year}/${month}/user_${userId}_${uuid}.${ext}`,
          absolute: path.join(avatarsDir, `${year}`, `${month}`, `user_${userId}_${uuid}.${ext}`)
        };
      case 'material':
        return {
          relative: `materials/${year}/${month}/${uuid}.${ext}`,
          absolute: path.join(materialsDir, `${year}`, `${month}`, `${uuid}.${ext}`)
        };
      case 'course-cover':
        return {
          relative: `covers/${year}/${month}/${uuid}.${ext}`,
          absolute: path.join(coversDir, `${year}`, `${month}`, `${uuid}.${ext}`)
        };
      default:
        const tempDir = path.join(uploadDir, 'temp', uuid);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        return {
          relative: `temp/${uuid}/${fileName}`,
          absolute: path.join(tempDir, fileName)
        };
    }
  }

  /**
   * 保存文件到本地
   */
  static async saveFile(type, userId, file) {
    try {
      const filePaths = this.generateFilePath(type, userId, file.originalname || file.name);

      // 确保目录存在
      const dir = path.dirname(filePaths.absolute);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(filePaths.absolute, file.buffer);

      // 生成本地访问URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
      const url = `${baseUrl}/uploads/${filePaths.relative}`;

      return {
        url: url,
        name: filePaths.relative,
        path: filePaths.absolute,
        size: file.size,
      };
    } catch (error) {
      logger.error('Local storage save error:', error);
      throw new Error(`文件保存失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   */
  static async deleteFile(relativePath) {
    try {
      const absolutePath = path.join(uploadDir, relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        logger.info(`File deleted: ${relativePath}`);
      }
      return true;
    } catch (error) {
      logger.error('Delete file error:', error);
      throw new Error(`删除文件失败: ${error.message}`);
    }
  }

  /**
   * 获取文件流（用于下载）
   */
  static getFileStream(relativePath) {
    try {
      const absolutePath = path.join(uploadDir, relativePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error('文件不存在');
      }
      return fs.createReadStream(absolutePath);
    } catch (error) {
      logger.error('Get file stream error:', error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   */
  static fileExists(relativePath) {
    try {
      const absolutePath = path.join(uploadDir, relativePath);
      return fs.existsSync(absolutePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证文件类型
   */
  static validateFileType(fileName, allowedTypes) {
    const ext = fileName.split('.').pop().toLowerCase();
    return allowedTypes.includes(ext);
  }

  /**
   * 验证文件大小
   */
  static validateFileSize(fileSize, maxSize) {
    return fileSize <= maxSize;
  }

  /**
   * 获取文件信息
   */
  static getFileInfo(relativePath) {
    try {
      const absolutePath = path.join(uploadDir, relativePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error('文件不存在');
      }
      const stats = fs.statSync(absolutePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error('Get file info error:', error);
      throw error;
    }
  }
}

module.exports = StorageService;
