# 部署检查清单

## 📋 部署前准备

### 1. 数据库准备

- [ ] **购买/准备云数据库**
  - 阿里云 PolarDB for MySQL
  - 腾讯云 MySQL
  - AWS RDS
  - 或自建 MySQL 8.0+

- [ ] **创建数据库**
  ```sql
  CREATE DATABASE course_sharing_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
  ```

- [ ] **导入数据库表结构**
  - 参考 `docs/02-数据库设计.md` 中的表结构
  - 创建 8 张核心表
  - 创建索引以优化查询性能

- [ ] **创建测试用户**
  ```sql
  -- 管理员账号
  INSERT INTO users (email, password, username, role, status)
  VALUES ('admin@example.com', '$2a$10$...', '管理员', 'admin', 1);
  ```

### 2. 对象存储准备（可选）

- [ ] **开通对象存储服务**
  - 阿里云 OSS
  - 腾讯云 COS
  - AWS S3

- [ ] **创建 Bucket**
  - 名称：course-platform-files
  - 权限：私有读
  - 地域：选择离你用户最近的区域

- [ ] **获取访问密钥**
  - Access Key ID
  - Access Key Secret

### 3. 服务器准备

- [ ] **准备服务器**
  - 阿里云 ECS (2核4GB 起步)
  - 腾讯云 CVM
  - 或其他云服务器

- [ ] **安装运行环境**
  ```bash
  # 安装 Node.js 18+
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
  sudo yum install -y nodejs

  # 安装 Nginx
  sudo yum install -y nginx

  # 安装 PM2（进程管理）
  sudo npm install -g pm2
  ```

---

## 🔧 后端配置修改

### 文件位置：`backend/.env.production`

**必须修改的配置：**

```bash
# ❌ 修改前
DB_HOST=localhost
DB_PASSWORD=root
CORS_ORIGIN=http://localhost:5173

# ✅ 修改后
DB_HOST=rm-xxxxx.mysql.rds.aliyuncs.com  # 改为你的云数据库地址
DB_PASSWORD=YourStrongPassword123        # 改为强密码
CORS_ORIGIN=https://your-domain.com      # 改为你的前端域名
```

**安全配置：**

```bash
# ⚠️ 必须修改为强随机字符串（至少32位）
JWT_SECRET=use_openssl_rand_base64_32_to_generate
```

生成 JWT_SECRET：
```bash
openssl rand -base64 32
```

**OSS 配置（如果使用）：**

```bash
OSS_REGION=oss-cn-hangzhou              # 改为你的 OSS 区域
OSS_ACCESS_KEY_ID=your_key_id           # 改为你的 Access Key
OSS_ACCESS_KEY_SECRET=your_secret_key   # 改为你的 Secret
OSS_BUCKET_NAME=your_bucket_name        # 改为你的 Bucket 名称
```

### 检查项：

- [ ] 数据库连接信息已更新
- [ ] JWT_SECRET 已更改为强随机字符串
- [ ] CORS_ORIGIN 已更改为生产域名
- [ ] OSS 配置已填写（如果使用）
- [ ] LOG_LEVEL 设置为 `error` 或 `warn`

---

## 🎨 前端配置修改

### 文件位置：`frontend/.env.production`

**必须修改的配置：**

```bash
# ❌ 修改前
VITE_API_BASE_URL=http://localhost:8080/api/v1

# ✅ 修改后（三种方案选一种）

# 方案1：直接指向后端域名
VITE_API_BASE_URL=https://api.your-domain.com/api/v1

# 方案2：使用同域（推荐，需要 Nginx 代理）
VITE_API_BASE_URL=/api/v1

# 方案3：使用相对路径
VITE_API_BASE_URL=/api/v1
```

### 检查项：

- [ ] API_BASE_URL 已更改为生产环境地址
- [ ] 如有其他环境变量也已更新

---

## 🚀 部署步骤

### 方案一：传统部署（推荐新手）

#### 1. 上传代码

```bash
# 在服务器上
cd /var/www
git clone https://github.com/aikunkun9527/Course-materials-sharing-platform.git
cd Course-materials-sharing-platform
```

#### 2. 安装依赖

```bash
# 后端
cd backend
npm install --production

# 前端
cd ../frontend
npm install
```

#### 3. 构建前端

```bash
cd frontend
npm run build
# 构建产物在 dist/ 目录
```

#### 4. 配置 Nginx

创建 `/etc/nginx/conf.d/course-platform.conf`:

```nginx
# 后端 API 代理
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/Course-materials-sharing-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

重启 Nginx：
```bash
sudo nginx -t          # 测试配置
sudo systemctl restart nginx
```

#### 5. 启动后端服务

```bash
cd /var/www/Course-materials-sharing-platform/backend

# 使用 PM2 启动
pm2 start src/app.js --name course-platform-backend

# 保存 PM2 配置
pm2 save
pm2 startup
```

#### 6. 配置 SSL 证书（HTTPS）

```bash
# 安装 certbot
sudo yum install -y certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 0 * * * certbot renew --quiet
```

---

### 方案二：Docker 部署（推荐进阶）

#### 1. 构建镜像

```bash
# 构建后端镜像
docker build -t course-backend:latest ./backend

# 构建前端镜像
docker build -t course-frontend:latest ./frontend
```

#### 2. 使用 Docker Compose

修改 `docker/docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: course-backend:latest
    container_name: course-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DB_HOST=your_db_host
      - DB_PASSWORD=your_password
      # ... 其他环境变量
    volumes:
      - ./uploads:/app/uploads

  frontend:
    image: course-frontend:latest
    container_name: course-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
```

启动：
```bash
cd docker
docker-compose up -d
```

---

### 方案三：Serverless 部署（阿里云 SAE）

#### 1. 构建并推送镜像

```bash
# 登录阿里云镜像仓库
docker login registry.cn-hangzhou.aliyuncs.com

# 打标签
docker tag course-backend:latest registry.cn-hangzhou.aliyuncs.com/your-namespace/course-backend:latest

# 推送
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/course-backend:latest
```

#### 2. 在 SAE 控制台

1. 创建应用
2. 选择镜像部署
3. 填写镜像地址
4. 配置环境变量
5. 设置健康检查 `/health`
6. 启动应用

---

## ✅ 部署后验证

### 1. 检查后端服务

```bash
# 检查服务状态
pm2 status
# 或
docker ps

# 查看日志
pm2 logs course-platform-backend
# 或
docker logs course-backend

# 测试 API
curl https://your-domain.com/api/v1/health
```

### 2. 检查前端服务

```bash
# 访问前端
curl -I https://your-domain.com

# 检查静态文件
ls -la /var/www/Course-materials-sharing-platform/frontend/dist
```

### 3. 功能测试

- [ ] 访问首页正常
- [ ] 注册/登录功能正常
- [ ] 课程创建功能正常
- [ ] 文件上传功能正常
- [ ] 讨论区功能正常
- [ ] 管理后台功能正常

---

## 🔒 安全检查

### 必做项：

- [ ] 修改所有默认密码
- [ ] JWT_SECRET 使用强随机字符串
- [ ] 数据库不暴露在公网
- [ ] 配置防火墙规则
- [ ] 开启 HTTPS
- [ ] 关闭 DEBUG 模式
- [ ] 设置合理的 CORS 策略
- [ ] 配置日志轮转
- [ ] 设置定期备份

### 推荐项：

- [ ] 配置 WAF 防火墙
- [ ] 开启 CDN 加速
- [ ] 配置监控告警
- [ ] 设置自动备份
- [ ] 使用 Redis 缓存

---

## 📊 监控与日志

### 日志位置

```bash
# PM2 日志
~/.pm2/logs/

# Nginx 日志
/var/log/nginx/

# 应用日志（如果配置）
/var/log/course-platform/
```

### 监控命令

```bash
# PM2 监控
pm2 monit

# 系统资源
htop

# Nginx 访问日志
tail -f /var/log/nginx/access.log
```

---

## 🆘 常见问题

### Q1: 后端启动失败

**检查步骤：**
1. 查看日志：`pm2 logs` 或 `docker logs`
2. 检查环境变量是否正确
3. 检查数据库连接是否正常
4. 检查端口是否被占用：`netstat -tunlp | grep 8080`

### Q2: 前端无法访问后端 API

**检查步骤：**
1. 检查 CORS_ORIGIN 配置
2. 检查 Nginx 代理配置
3. 检查后端服务是否运行
4. 检查浏览器控制台错误信息

### Q3: 文件上传失败

**检查步骤：**
1. 检查上传目录权限
2. 检查文件大小限制
3. 检查 OSS 配置（如果使用）
4. 检查 Nginx client_max_body_size

### Q4: 数据库连接失败

**检查步骤：**
1. 检查数据库地址是否正确
2. 检查数据库用户名密码
3. 检查数据库白名单（IP 是否允许）
4. 测试数据库连通性：`telnet db_host 3306`

---

## 📞 获取帮助

如遇到问题：
1. 查看项目文档：`docs/06-部署指南.md`
2. 提交 Issue：https://github.com/aikunkun9527/Course-materials-sharing-platform/issues
3. 联系作者：3273139633@qq.com

---

## 📝 部署检查清单总结

### 配置文件清单

- [ ] `backend/.env.production` - 后端生产环境配置
- [ ] `frontend/.env.production` - 前端生产环境配置
- [ ] `/etc/nginx/conf.d/course-platform.conf` - Nginx 配置

### 环境变量清单

**后端必须修改：**
- [ ] DB_HOST
- [ ] DB_PASSWORD
- [ ] JWT_SECRET
- [ ] CORS_ORIGIN
- [ ] OSS_ACCESS_KEY_ID（如果使用）
- [ ] OSS_ACCESS_KEY_SECRET（如果使用）

**前端必须修改：**
- [ ] VITE_API_BASE_URL

### 部署完成标志

- [ ] 后端服务运行正常
- [ ] 前端页面访问正常
- [ ] HTTPS 证书已配置
- [ ] 所有功能测试通过
- [ ] 监控和备份已配置

---

**祝你部署顺利！** 🎉
