# GitHub Container Registry 部署指南

本指南介绍如何使用 GitHub Container Registry (GHCR) 部署课程资料分享平台。

## 目录
- [优势](#优势)
- [前置要求](#前置要求)
- [配置步骤](#配置步骤)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

## 优势

使用 GitHub Container Registry 相比阿里云容器镜像服务的优势：

1. **与GitHub深度集成** - 自动触发构建,无需手动操作
2. **免费额度充足** - 公开仓库免费,私有仓库每月500MB存储
3. **全球CDN加速** - 快速拉取镜像
4. **简化权限管理** - 使用GitHub Token,无需额外配置
5. **自动化工作流** - 推送代码自动构建镜像

## 前置要求

1. GitHub账号
2. Docker服务器(阿里云ECS、本地服务器等)
3. 域名(可选,用于生产环境)
4. 阿里云RDS MySQL数据库
5. 阿里云OSS存储服务

## 配置步骤

### 1. 启用GitHub Packages

1. 访问你的GitHub仓库设置
2. 进入 "Actions" -> "General"
3. 确保 "Workflow permissions" 设置为 "Read and write permissions"
4. 勾选 "Allow GitHub Actions to create and approve pull requests"

### 2. 准备环境配置文件

在服务器上创建环境配置文件:

```bash
# 复制模板
cp .env.production.template .env.production

# 编辑配置
nano .env.production
```

填写以下关键配置:

```bash
# 数据库配置
DB_HOST=your-rds-mysql-instance.rds.aliyuncs.com
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=course_sharing_platform

# OSS配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_oss_access_key_id
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
OSS_BUCKET_NAME=your_bucket_name

# JWT密钥 (使用随机字符串)
JWT_SECRET=your_random_secret_key_min_32_characters

# CORS配置
CORS_ORIGIN=https://your-domain.com

# 前端API地址
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### 3. 登录到GHCR

在你的Docker服务器上:

```bash
echo "你的GitHub_PAT" | docker login ghcr.io -u 你的GitHub用户名 --password-stdin
```

**注意**: 获取GitHub Personal Access Token:
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" -> "Generate new token (classic)"
3. 勾选 `write:packages` 和 `read:packages`
4. 生成并复制token

### 4. 部署服务

#### 方法一: 使用docker-compose(推荐)

```bash
# 下载docker-compose配置
wget https://raw.githubusercontent.com/aikunkun9527/Course-materials-sharing-platform/main/docker-compose.prod.yml

# 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

#### 方法二: 手动运行

```bash
# 拉取镜像
docker pull ghcr.io/aikunkun9527/course-materials-sharing-platform/backend:latest
docker pull ghcr.io/aikunkun9527/course-materials-sharing-platform/frontend:latest

# 运行后端
docker run -d \
  --name course-platform-backend \
  --env-file .env.production \
  -p 8080:8080 \
  ghcr.io/aikunkun9527/course-materials-sharing-platform/backend:latest

# 运行前端
docker run -d \
  --name course-platform-frontend \
  -e VITE_API_BASE_URL=https://your-api-domain.com/api/v1 \
  -p 80:80 \
  ghcr.io/aikunkun9527/course-materials-sharing-platform/frontend:latest
```

## 部署流程

### 自动构建流程

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "feat: 新功能"
   git push origin main
   ```

2. **自动触发GitHub Actions**
   - 检测到main分支的推送
   - 自动构建Docker镜像
   - 推送到GHCR

3. **查看构建状态**
   - 访问仓库的 "Actions" 标签
   - 查看workflow运行状态

4. **在服务器上更新镜像**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

### 镜像标签策略

GitHub Actions会自动创建以下标签:

- `latest` - 最新的main分支构建
- `main-<sha>` - 带commit SHA的镜像
- `v1.0.0` - 语义化版本标签(创建Git tag时)

## 常见问题

### Q1: 如何查看可用的镜像版本?

访问GHCR页面:
```
https://ghcr.io/aikunkun9527/course-materials-sharing-platform/backend
https://ghcr.io/aikunkun9527/course-materials-sharing-platform/frontend
```

### Q2: 镜像拉取失败怎么办?

1. 检查是否已登录GHCR
   ```bash
   docker login ghcr.io -u <username>
   ```

2. 检查网络连接
   ```bash
   ping ghcr.io
   ```

3. 重启Docker服务
   ```bash
   systemctl restart docker
   ```

### Q3: 如何回滚到之前的版本?

```bash
# 查看本地镜像
docker images | grep course-materials-sharing-platform

# 使用特定标签运行
docker run -d \
  --name course-platform-backend \
  --env-file .env.production \
  -p 8080:8080 \
  ghcr.io/aikunkun9527/course-materials-sharing-platform/backend:main-abc123
```

### Q4: 如何设置镜像为公开访问?

1. 访问仓库的 "Settings" -> "Actions" -> "General"
2. 滚动到 "Workflow permissions"
3. 选择 "Read and write permissions"
4. 在GHCR包页面设置 visibility 为 Public

### Q5: 构建失败怎么办?

1. 访问仓库的 "Actions" 标签
2. 点击失败的workflow run
3. 查看详细日志
4. 常见问题:
   - Dockerfile语法错误
   - 依赖安装失败
   - 权限不足

## 成本估算

### GitHub Container Registry
- **公开仓库**: 完全免费
- **私有仓库**:
  - 存储: $0.25/GB
  - 数据传输: 免费进出

### 本示例项目
- 后端镜像: ~200MB
- 前端镜像: ~100MB
- 总计: ~300MB

**预估成本**: 私有仓库约 $0.075/月 (或免费使用公开仓库)

## 监控和维护

### 查看容器状态

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs course-platform-backend
docker logs course-platform-frontend

# 查看资源使用
docker stats
```

### 更新服务

```bash
# 拉取最新镜像
docker-compose -f docker-compose.prod.yml pull

# 重启服务
docker-compose -f docker-compose.prod.yml up -d

# 清理旧镜像
docker image prune -a
```

### 备份数据

```bash
# 备份日志
docker cp course-platform-backend:/app/logs ./backup/logs-$(date +%Y%m%d)

# 备份数据库(使用阿里云RDS自动备份)
```

## 下一步

1. 配置域名和SSL证书
2. 设置监控告警
3. 配置自动备份
4. 性能优化

## 参考资源

- [GitHub Container Registry文档](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [GitHub Actions文档](https://docs.github.com/en/actions)
