const express = require('express');
const router = express.Router();
const MaterialController = require('../controllers/material.controller');
const { authenticate } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// 公开路由（但需要认证）
router.get('/search', authenticate, MaterialController.search);
router.get('/:id', authenticate, MaterialController.getById);

// 需要认证的路由
router.get('/course/:courseId', authenticate, MaterialController.getByCourseId);
router.post('/', authenticate, upload.single('file'), MaterialController.upload);
router.post('/upload-signature', authenticate, MaterialController.getUploadSignature);
router.post('/confirm-upload', authenticate, MaterialController.confirmUpload);
router.get('/:id/download', authenticate, MaterialController.download);
router.put('/:id', authenticate, MaterialController.update);
router.delete('/:id', authenticate, MaterialController.delete);

module.exports = router;
