const cors = require('cors');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:5173'];

    // 开发环境允许所有来源
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // 允许没有origin的请求(如服务器端请求、移动应用等)
    if (!origin) {
      callback(null, true);
      return;
    }

    // 检查origin是否在允许列表中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('不允许的CORS请求'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition'], // 允许前端访问 Content-Disposition 头
};

module.exports = cors(corsOptions);
