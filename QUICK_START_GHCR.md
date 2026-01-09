# GHCR快速部署指南

## 快速开始(5分钟部署)

### 1. 准备GitHub Token

访问 https://github.com/settings/tokens/new
- 勾选 `write:packages` 和 `read:packages`
- 生成并复制token

### 2. 在服务器上登录GHCR

```bash
echo "你的GitHub_Token" | docker login ghcr.io -u 你的GitHub用户名 --password-stdin
```

### 3. 创建环境配置文件

```bash
cat > .env.production << 'EOF'
# 数据库配置
DB_HOST=your-rds-mysql.rds.aliyuncs.com
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=course_sharing_platform

# OSS配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_key_id
OSS_ACCESS_KEY_SECRET=your_key_secret
OSS_BUCKET_NAME=your_bucket

# JWT密钥
JWT_SECRET=your_jwt_secret_min_32_chars

# CORS和API
CORS_ORIGIN=https://your-domain.com
VITE_API_BASE_URL=https://your-domain.com/api/v1
EOF
```

### 4. 启动服务

```bash
# 下载配置文件
curl -O https://raw.githubusercontent.com/aikunkun9527/Course-materials-sharing-platform/main/docker-compose.prod.yml

# 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 查看状态
docker-compose -f docker-compose.prod.yml ps
```

### 5. 验证部署

```bash
# 检查后端健康
curl http://localhost:8080/health

# 访问前端
# 浏览器打开: http://your-server-ip
```

## 更新服务

当代码推送到GitHub后:

```bash
# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 重启服务
docker-compose -f docker-compose.prod.yml up -d
```

## 镜像地址

- **后端**: `ghcr.io/aikunkun9527/course-materials-sharing-platform/backend:latest`
- **前端**: `ghcr.io/aikunkun9527/course-materials-sharing-platform/frontend:latest`

## 查看日志

```bash
# 所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 单个服务日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

## 停止服务

```bash
docker-compose -f docker-compose.prod.yml down
```

## 故障排查

### 问题: 无法拉取镜像

```bash
# 检查登录状态
docker login ghcr.io

# 重新登录
echo "token" | docker login ghcr.io -u username --password-stdin
```

### 问题: 容器启动失败

```bash
# 查看详细日志
docker-compose -f docker-compose.prod.yml logs backend

# 检查环境变量
docker-compose -f docker-compose.prod.yml config
```

### 问题: 数据库连接失败

```bash
# 检查数据库连接
docker exec course-platform-backend ping your-db-host

# 查看后端日志
docker logs course-platform-backend
```

## 更多信息

详细文档请参考: [DEPLOY_TO_GHCR.md](./DEPLOY_TO_GHCR.md)
