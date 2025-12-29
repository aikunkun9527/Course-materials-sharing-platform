const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const Joi = require('joi');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');

// 验证schema
const updateProfileSchema = Joi.object({
  username: Joi.string().min(2).max(50).optional(),
  bio: Joi.string().max(500).optional().allow('', null),
});

const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(6).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.number().valid(0, 1).required(),
});

// 需要认证的路由（必须在 /:id 之前）
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), UserController.updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), UserController.uploadAvatar);
router.put('/password', authenticate, validate(changePasswordSchema), UserController.changePassword);

// 公开路由（必须在 /profile 之后）
router.get('/:id', UserController.getPublicProfile);

// 管理员路由
router.get('/', authenticate, authorize('admin'), UserController.getList);
router.put('/:id/status', authenticate, authorize('admin'), validate(updateStatusSchema), UserController.updateStatus);
router.delete('/:id', authenticate, authorize('admin'), UserController.delete);

module.exports = router;
