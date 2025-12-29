const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/comment.controller');
const { authenticate } = require('../middlewares/auth');

// 评论路由
router.get('/discussion/:discussionId', authenticate, CommentController.getByDiscussionId);
router.post('/', authenticate, CommentController.create);
router.put('/:id', authenticate, CommentController.update);
router.delete('/:id', authenticate, CommentController.delete);
router.post('/:id/like', authenticate, CommentController.toggleLike);

module.exports = router;