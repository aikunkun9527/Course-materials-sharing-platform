const OSS = require('ali-oss');
const ossConfig = require('../config/oss');
const logger = require('../utils/logger');
const crypto = require('crypto');

// 初始化OSS客户端
const ossClient = new OSS({
  region: ossConfig.region,
  accessKeyId: ossConfig.accessKeyId,
  accessKeySecret: ossConfig.accessKeySecret,
  bucket: ossConfig.bucket,
  endpoint: ossConfig.endpoint,
});

class OSSService {
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
        return `avatars/${year}/${month}/user_${userId}_${uuid}.${ext}`;
      case 'material':
        return `materials/${year}/${month}/${uuid}.${ext}`;
      case 'course-cover':
        return `course-covers/${year}/${month}/${uuid}.${ext}`;
      default:
        return `uploads/temp/${uuid}/${fileName}`;
    }
  }

  /**
   * 上传文件到OSS（服务端上传）
   */
  static async uploadFile(type, userId, file) {
    try {
      const filePath = this.generateFilePath(type, userId, file.originalname || file.name);

      const result = await ossClient.put(filePath, file.buffer || file);

      return {
        url: result.url,
        name: result.name,
        size: file.size,
      };
    } catch (error) {
      logger.error('OSS upload error:', error);
      throw new Error(`OSS上传失败: ${error.message}`);
    }
  }

  /**
   * 生成临时访问URL (签名URL)
   */
  static async getSignedUrl(objectName, expires = 3600) {
    try {
      const url = ossClient.signatureUrl(objectName, {
        expires,
        method: 'GET',
      });
      return url;
    } catch (error) {
      logger.error('Generate signed URL error:', error);
      throw new Error(`生成签名URL失败: ${error.message}`);
    }
  }

  /**
   * 删除文件
   */
  static async deleteFile(objectName) {
    try {
      await ossClient.delete(objectName);
      logger.info(`File deleted: ${objectName}`);
      return true;
    } catch (error) {
      logger.error('Delete file error:', error);
      throw new Error(`删除文件失败: ${error.message}`);
    }
  }

  /**
   * 批量删除文件
   */
  static async deleteMultipleFiles(objectNames) {
    try {
      await ossClient.deleteMulti(objectNames);
      logger.info(`Multiple files deleted: ${objectNames.length}`);
      return true;
    } catch (error) {
      logger.error('Delete multiple files error:', error);
      throw new Error(`批量删除文件失败: ${error.message}`);
    }
  }

  /**
   * 获取上传策略（前端直传）
   */
  static async getUploadPolicy(userId, fileName, fileSize) {
    try {
      const filePath = this.generateFilePath('material', userId, fileName);

      // 生成过期时间（1小时后）
      const expiration = new Date(Date.now() + 3600 * 1000).toISOString();

      // 上传策略
      const policy = {
        expiration,
        conditions: [
          ['content-length-range', 0, fileSize],
          ['starts-with', '$key', filePath],
        ],
      };

      // 生成Base64策略
      const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64');

      // 签名
      const signature = Buffer.from(
        crypto
          .createHmac('sha1', ossConfig.accessKeySecret)
          .update(policyBase64)
          .digest()
      ).toString('base64');

      return {
        region: ossConfig.region,
        bucket: ossConfig.bucket,
        accessKeyId: ossConfig.accessKeyId,
        policy: policyBase64,
        signature,
        filePath,
        endpoint: ossConfig.endpoint,
        expiration,
      };
    } catch (error) {
      logger.error('Get upload policy error:', error);
      throw new Error(`获取上传策略失败: ${error.message}`);
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
  static async getFileInfo(objectName) {
    try {
      const result = await ossClient.head(objectName);
      return {
        size: result.res.headers['content-length'],
        type: result.res.headers['content-type'],
        lastModified: result.res.headers['last-modified'],
      };
    } catch (error) {
      logger.error('Get file info error:', error);
      throw new Error(`获取文件信息失败: ${error.message}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  static async fileExists(objectName) {
    try {
      await ossClient.head(objectName);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * 复制文件
   */
  static async copyFile(sourceObject, targetObject) {
    try {
      await ossClient.copy(sourceObject, targetObject);
      logger.info(`File copied from ${sourceObject} to ${targetObject}`);
      return true;
    } catch (error) {
      logger.error('Copy file error:', error);
      throw new Error(`复制文件失败: ${error.message}`);
    }
  }
}

module.exports = OSSService;
