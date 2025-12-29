const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.memoryStorage(); // 使用内存存储，因为我们在Controller中处理文件

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制100MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'mp4', 'avi', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif'];
    const ext = file.originalname.split('.').pop().toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}`));
    }
  },
});

module.exports = upload;
