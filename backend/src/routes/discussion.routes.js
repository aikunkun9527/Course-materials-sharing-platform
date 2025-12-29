const express = require('express');
const router = express.Router();
const DiscussionController = require('../controllers/discussion.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// 讨论路由
router.get('/search', authenticate, DiscussionController.search);
router.get('/course/:courseId', authenticate, DiscussionController.getByCourseId);
router.get('/:id', authenticate, DiscussionController.getById);
router.post('/', authenticate, DiscussionController.create);
router.put('/:id', authenticate, DiscussionController.update);
router.delete('/:id', authenticate, DiscussionController.delete);
router.post('/:id/like', authenticate, DiscussionController.toggleLike);
router.put('/:id/pin', authenticate, authorize('admin'), DiscussionController.togglePin);
router.put('/:id/lock', authenticate, authorize('admin'), DiscussionController.toggleLock);

module.exports = router;
