const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const OSS = require('ali-oss');

// 初始化OSS客户端
let ossClient = null;

// 检查是否配置了OSS
const hasOSSConfig = () => {
  return process.env.OSS_ACCESS_KEY_ID &&
         process.env.OSS_ACCESS_KEY_SECRET &&
         process.env.OSS_BUCKET_NAME &&
         process.env.OSS_REGION;
};

// 获取OSS客户端
const getOSSClient = () => {
  if (!hasOSSConfig()) {
    return null;
  }

  if (!ossClient) {
    ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET_NAME,
    });
    logger.info('OSS client initialized');
  }

  return ossClient;
};

// 本地存储目录（作为fallback）
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
          oss: `avatars/${year}/${month}/user_${userId}_${uuid}.${ext}`,
          absolute: path.join(avatarsDir, `${year}`, `${month}`, `user_${userId}_${uuid}.${ext}`)
        };
      case 'material':
        return {
          relative: `materials/${year}/${month}/${uuid}.${ext}`,
          oss: `materials/${year}/${month}/${uuid}.${ext}`,
          absolute: path.join(materialsDir, `${year}`, `${month}`, `${uuid}.${ext}`)
        };
      case 'course-cover':
        return {
          relative: `covers/${year}/${month}/${uuid}.${ext}`,
          oss: `covers/${year}/${month}/${uuid}.${ext}`,
          absolute: path.join(coversDir, `${year}`, `${month}`, `${uuid}.${ext}`)
        };
      default:
        const tempDir = path.join(uploadDir, 'temp', uuid);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        return {
          relative: `temp/${uuid}/${fileName}`,
          oss: `temp/${uuid}/${fileName}`,
          absolute: path.join(tempDir, fileName)
        };
    }
  }

  /**
   * 保存文件（优先使用OSS，fallback到本地）
   */
  static async saveFile(type, userId, file) {
    try {
      const filePaths = this.generateFilePath(type, userId, file.originalname || file.name);

      // 优先使用OSS
      const client = getOSSClient();
      if (client) {
        try {
          logger.info(`Uploading to OSS: ${filePaths.oss}`);

          // 上传到OSS
          const result = await client.put(filePaths.oss, file.buffer);

          logger.info(`OSS upload success: ${result.url}`);

          // 返回OSS的URL
          return {
            url: result.url,
            name: filePaths.oss,
            path: filePaths.oss,
            size: file.size,
            storage: 'oss',
          };
        } catch (ossError) {
          logger.error('OSS upload failed, fallback to local storage:', ossError);
          // OSS上传失败，fallback到本地存储
        }
      } else {
        logger.info('OSS not configured, using local storage');
      }

      // 本地存储（OSS未配置或上传失败时的fallback）
      const dir = path.dirname(filePaths.absolute);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(filePaths.absolute, file.buffer);

      // 生成本地访问URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
      const url = `${baseUrl}/uploads/${filePaths.relative}`;

      logger.info(`File saved to local storage: ${filePaths.relative}`);

      return {
        url: url,
        name: filePaths.relative,
        path: filePaths.absolute,
        size: file.size,
        storage: 'local',
      };
    } catch (error) {
      logger.error('Save file error:', error);
      throw new Error(`文件保存失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   */
  static async deleteFile(relativePath) {
    try {
      const client = getOSSClient();

      // 先尝试从OSS删除
      if (client) {
        try {
          // 检查是否是OSS路径
          if (!relativePath.startsWith('http')) {
            await client.delete(relativePath);
            logger.info(`OSS file deleted: ${relativePath}`);
            return true;
          }
        } catch (ossError) {
          logger.warn(`OSS delete failed: ${ossError.message}`);
        }
      }

      // 从本地删除
      const absolutePath = path.join(uploadDir, relativePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        logger.info(`Local file deleted: ${relativePath}`);
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
      // 如果是OSS URL，需要先下载到本地（这里简化处理）
      if (relativePath.startsWith('http')) {
        throw new Error('OSS文件不支持直接流式下载，请使用签名URL');
      }

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
      // OSS URL
      if (relativePath.startsWith('http')) {
        return true; // 简化处理，实际应该调用OSS headObject
      }

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
      // OSS URL
      if (relativePath.startsWith('http')) {
        return { storage: 'oss' };
      }

      const absolutePath = path.join(uploadDir, relativePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error('文件不存在');
      }
      const stats = fs.statSync(absolutePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        storage: 'local',
      };
    } catch (error) {
      logger.error('Get file info error:', error);
      throw error;
    }
  }

  /**
   * 生成OSS签名URL（用于下载）
   */
  static async getSignedUrl(objectKey, expires = 3600) {
    try {
      const client = getOSSClient();
      if (!client) {
        throw new Error('OSS未配置');
      }

      const url = client.signatureUrl(objectKey, { expires });
      logger.info(`Generated signed URL for: ${objectKey}`);
      return url;
    } catch (error) {
      logger.error('Generate signed URL error:', error);
      throw error;
    }
  }
}

module.exports = StorageService;
