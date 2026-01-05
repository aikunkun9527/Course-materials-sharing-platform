const Material = require('../models/material.model');
const Course = require('../models/course.model');
const StorageService = require('../services/storage.service');
const Response = require('../utils/response');
const logger = require('../utils/logger');

class MaterialController {
  /**
   * 获取课程资料列表
   */
  static async getByCourseId(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;
      const { page = 1, limit = 20, type, keyword, sort } = req.query;

      // 检查课程是否存在
      const course = await Course.findById(courseId);
      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查用户是否是课程成员
      if (userId) {
        const isMember = await Course.isMember(courseId, userId);
        if (!isMember && course.creator_id !== userId) {
          return Response.forbidden(res, '不是课程成员');
        }
      }

      const result = await Material.getByCourseId(courseId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        keyword,
        sort,
      });

      return Response.success(res, result);
    } catch (error) {
      logger.error('Get materials error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取资料详情
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const material = await Material.findById(id);

      if (!material) {
        return Response.notFound(res, '资料不存在');
      }

      return Response.success(res, material);
    } catch (error) {
      logger.error('Get material detail error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 上传资料
   */
  static async upload(req, res) {
    try {
      const userId = req.user.id;
      const { courseId, title, description } = req.body;
      const file = req.file;

      if (!file) {
        return Response.error(res, '请选择文件', 400);
      }

      if (!title) {
        return Response.error(res, '资料标题不能为空', 400);
      }

      // 检查课程是否存在
      const course = await Course.findById(courseId);
      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查用户是否是课程成员
      const isMember = await Course.isMember(courseId, userId);
      if (!isMember && course.creator_id !== userId) {
        return Response.forbidden(res, '不是课程成员');
      }

      // 验证文件类型
      const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'mp4', 'avi', 'zip', 'rar'];
      if (!StorageService.validateFileType(file.originalname, allowedTypes)) {
        return Response.error(res, '不支持的文件类型', 400);
      }

      // 验证文件大小（最大100MB）
      const maxSize = 100 * 1024 * 1024;
      if (!StorageService.validateFileSize(file.size, maxSize)) {
        return Response.error(res, '文件大小不能超过100MB', 400);
      }

      // 上传到本地存储
      const storageResult = await StorageService.saveFile('material', userId, file);

      // 处理文件名编码 - 优先使用前端发送的 originalFileName
      let fileName = file.originalname;

      // 如果前端提供了原始文件名字段，优先使用
      if (req.body.originalFileName) {
        fileName = req.body.originalFileName;
        logger.info(`Using originalFileName from request: ${fileName}`);
      } else {
        // 否则尝试修复 file.originalname 的编码
        try {
          const buffer = Buffer.from(fileName, 'latin1');
          const decoded = buffer.toString('utf8');
          if (/^[\x00-\x7F]*$/.test(fileName) && !/^[\x00-\x7F]*$/.test(decoded)) {
            fileName = decoded;
            logger.info(`Fixed filename encoding: ${fileName}`);
          }
        } catch (e) {
          logger.warn('Filename encoding decode failed, using original:', e.message);
        }
      }

      // 保存到数据库
      const material = await Material.create({
        course_id: courseId,
        uploader_id: userId,
        title,
        description,
        file_url: storageResult.url,
        file_name: fileName, // 使用处理后的文件名
        file_size: file.size,
        file_type: file.mimetype.substring(0, 50), // 限制长度为50字符
        file_extension: file.originalname.split('.').pop(),
      });

      logger.info(`Material uploaded: ${material.id} by user ${userId}`);

      return Response.success(res, material, '上传成功', 201);
    } catch (error) {
      logger.error('Upload material error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 下载资料
   */
  static async download(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const ip = req.ip;
      const userAgent = req.headers['user-agent'];

      const material = await Material.findById(id);

      if (!material) {
        return Response.notFound(res, '资料不存在');
      }

      // 检查用户是否是课程成员
      const course = await Course.findById(material.course_id);
      const isMember = await Course.isMember(material.course_id, userId);
      if (!isMember && course.creator_id !== userId) {
        return Response.forbidden(res, '不是课程成员');
      }

      // 判断是OSS文件还是本地文件
      const isOSSFile = material.file_url.includes('oss-cn-shenzhen.aliyuncs.com') ||
                       material.file_url.includes('aliyuncs.com');

      if (isOSSFile) {
        // OSS文件：使用代理方式下载以保留原始文件名
        logger.info(`Downloading OSS file: ${material.file_url}`);

        // 记录下载日志
        await Material.logDownload({
          material_id: material.id,
          user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
        });

        // 更新下载次数
        await Material.incrementDownloadCount(material.id);

        logger.info(`Material downloaded: ${material.id} by user ${userId}`);

        // 从OSS获取文件并代理下载
        const axios = require('axios');
        const response = await axios({
          method: 'get',
          url: material.file_url,
          responseType: 'stream'
        });

        // 设置响应头以保留原始文件名
        const encodedFileName = encodeURIComponent(material.file_name);
        res.setHeader('Content-Type', material.file_type || response.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

        // 将OSS文件流转发给客户端
        response.data.pipe(res);
        return;
      } else {
        // 本地文件：从本地读取
        const urlPath = new URL(material.file_url).pathname;
        const relativePath = urlPath.replace('/uploads/', '');
        const absolutePath = require('path').join(__dirname, '../../uploads', relativePath);

        // 检查文件是否存在
        const fs = require('fs');
        if (!fs.existsSync(absolutePath)) {
          return Response.notFound(res, '文件不存在');
        }

        // 记录下载日志
        await Material.logDownload({
          material_id: material.id,
          user_id: userId,
          ip_address: ip,
          user_agent: userAgent,
        });

        // 更新下载次数
        await Material.incrementDownloadCount(material.id);

        logger.info(`Material downloaded: ${material.id} by user ${userId}`);

        // 读取文件
        const fileContent = fs.readFileSync(absolutePath);

        // 设置响应头 - 使用 RFC 5987 编码格式支持中文文件名
        const encodedFileName = encodeURIComponent(material.file_name);
        res.setHeader('Content-Type', material.file_type || 'application/octet-stream');

        // 使用 RFC 5987 标准，只使用 filename*，不使用 filename
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

        res.setHeader('Content-Length', fileContent.length);

        // 发送文件内容
        res.status(200).send(fileContent);
      }
    } catch (error) {
      logger.error('Download material error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 更新资料信息
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { title, description, is_public } = req.body;

      const material = await Material.findById(id);

      if (!material) {
        return Response.notFound(res, '资料不存在');
      }

      // 检查权限：只有上传者或管理员可以修改
      if (material.uploader_id !== userId && req.user.role !== 'admin') {
        return Response.forbidden(res, '无权限修改此资料');
      }

      const updatedMaterial = await Material.update(id, {
        title,
        description,
        is_public,
      });

      logger.info(`Material updated: ${id} by user ${userId}`);

      return Response.success(res, updatedMaterial, '更新成功');
    } catch (error) {
      logger.error('Update material error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 删除资料
   */
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const material = await Material.findById(id);

      if (!material) {
        return Response.notFound(res, '资料不存在');
      }

      // 检查权限：只有上传者或管理员可以删除
      if (material.uploader_id !== userId && req.user.role !== 'admin') {
        return Response.forbidden(res, '无权限删除此资料');
      }

      // 删除本地文件
      try {
        // 从URL中提取相对路径
        const urlPath = new URL(material.file_url).pathname;
        const relativePath = urlPath.replace('/uploads/', '');
        await StorageService.deleteFile(relativePath);
      } catch (error) {
        logger.warn(`Failed to delete local file: ${error.message}`);
      }

      // 删除数据库记录
      await Material.delete(id);

      logger.info(`Material deleted: ${id} by user ${userId}`);

      return Response.success(res, null, '删除成功');
    } catch (error) {
      logger.error('Delete material error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 获取上传策略（前端直传）
   */
  static async getUploadSignature(req, res) {
    try {
      const userId = req.user.id;
      const { fileName, fileSize, courseId } = req.body;

      if (!fileName || !fileSize || !courseId) {
        return Response.error(res, '缺少必要参数', 400);
      }

      // 检查课程是否存在
      const course = await Course.findById(courseId);
      if (!course) {
        return Response.notFound(res, '课程不存在');
      }

      // 检查用户是否是课程成员
      const isMember = await Course.isMember(courseId, userId);
      if (!isMember && course.creator_id !== userId) {
        return Response.forbidden(res, '不是课程成员');
      }

      // 验证文件类型
      const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'mp4', 'avi', 'zip', 'rar'];
      if (!StorageService.validateFileType(fileName, allowedTypes)) {
        return Response.error(res, '不支持的文件类型', 400);
      }

      // 验证文件大小
      const maxSize = 100 * 1024 * 1024;
      if (!StorageService.validateFileSize(fileSize, maxSize)) {
        return Response.error(res, '文件大小不能超过100MB', 400);
      }

      // 本地存储不支持前端直传，需要通过后端上传
      return Response.error(res, '请使用后端上传接口', 400);
    } catch (error) {
      logger.error('Get upload signature error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 确认上传（前端直传后调用）
   */
  static async confirmUpload(req, res) {
    try {
      const userId = req.user.id;
      const { courseId, title, description, fileUrl, fileName, fileSize, fileType } = req.body;

      if (!fileUrl || !fileName) {
        return Response.error(res, '缺少文件信息', 400);
      }

      // 保存到数据库
      const material = await Material.create({
        course_id: courseId,
        uploader_id: userId,
        title: title || fileName,
        description,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType || 'application/octet-stream',
        file_extension: fileName.split('.').pop(),
      });

      logger.info(`Material confirmed: ${material.id} by user ${userId}`);

      return Response.success(res, material, '上传成功', 201);
    } catch (error) {
      logger.error('Confirm upload error:', error);
      return Response.serverError(res, error.message);
    }
  }

  /**
   * 搜索资料
   */
  static async search(req, res) {
    try {
      const { keyword, page = 1, limit = 20 } = req.query;

      if (!keyword) {
        return Response.error(res, '搜索关键词不能为空', 400);
      }

      const result = await Material.search({
        keyword,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return Response.success(res, result);
    } catch (error) {
      logger.error('Search materials error:', error);
      return Response.serverError(res, error.message);
    }
  }
}

module.exports = MaterialController;
