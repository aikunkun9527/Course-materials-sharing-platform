require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const cors = require('./middlewares/cors');

const app = express();

// CORS 必须在 helmet 之前
app.use(cors);

// 安全中间件 - 但允许跨域图片加载
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 压缩响应
app.use(compression());

// 解析JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于本地存储的文件）
app.use('/uploads', express.static('uploads'));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API路由
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/courses', require('./routes/course.routes'));
app.use('/api/v1/materials', require('./routes/material.routes'));
app.use('/api/v1/discussions', require('./routes/discussion.routes'));
app.use('/api/v1/comments', require('./routes/comment.routes'));

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
