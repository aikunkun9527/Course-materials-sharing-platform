const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/course.controller');
const { authenticate, authenticateOptional, authorize } = require('../middlewares/auth');
const Joi = require('joi');
const validate = require('../middlewares/validate');

// 验证schema
const createCourseSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).optional().allow('', null),
  category: Joi.string().max(50).optional().allow('', null),
  cover_url: Joi.string().uri().optional().allow('', null),
  max_students: Joi.number().integer().min(1).optional().allow(null),
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().max(2000).optional().allow('', null),
  category: Joi.string().max(50).optional().allow('', null),
  cover_url: Joi.string().uri().optional().allow('', null),
  max_students: Joi.number().integer().min(1).optional().allow(null),
  status: Joi.string().valid('active', 'archived').optional(),
});

// 公开路由（可选认证：已登录用户可以看到自己的加入状态）
router.get('/', authenticateOptional, CourseController.getList);

// 我的课程列表 - 必须在 /:id 之前定义，否则 /my 会被当作课程 ID
router.get('/my', authenticate, CourseController.getMyCourses);

// 课程详情路由
router.get('/:id', authenticate, CourseController.getById);

// 需要认证的路由
router.post('/', authenticate, validate(createCourseSchema), CourseController.create);
router.put('/:id', authenticate, validate(updateCourseSchema), CourseController.update);
router.delete('/:id', authenticate, CourseController.delete);
router.post('/:id/enroll', authenticate, CourseController.enroll);
router.delete('/:id/enroll', authenticate, CourseController.unenroll);
router.get('/:id/members', authenticate, CourseController.getMembers);

module.exports = router;
