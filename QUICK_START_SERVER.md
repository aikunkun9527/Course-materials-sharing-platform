# 快速部署指南 - 阿里云轻量应用服务器

## 5分钟快速部署

### 前置准备

1. ✅ 已创建阿里云轻量应用服务器 (2核2G Ubuntu)
2. ✅ 已配置阿里云RDS MySQL数据库
3. ✅ 已配置阿里云OSS存储服务
4. ⬜ 获取数据库和OSS的连接信息

### 方法一: 使用自动化部署脚本(推荐)

#### 1. 连接到服务器

在阿里云控制台,点击"远程连接"→"",或使用SSH:

```bash
ssh root@你的服务器公网IP
```

#### 2. 下载并运行部署脚本

```bash
# 下载脚本
wget https://raw.githubusercontent.com/aikunkun9527/Course-materials-sharing-platform/main/deploy-server.sh

# 或手动创建
nano deploy-server.sh
# 复制脚本内容并保存

# 添加执行权限
chmod +x deploy-server.sh

# 运行脚本
./deploy-server.sh
```

#### 3. 按照提示配置

脚本会自动:
- ✅ 安装Docker和Docker Compose
- ✅ 安装Nginx
- ✅ 配置防火墙
- ✅ 克隆项目代码
- ✅ 构建Docker镜像
- ⚠️ **需要你手动配置环境变量**

#### 4. 配置环境变量

当脚本提示时,编辑 `.env.production`:

```bash
cd /opt/course-platform
vim .env.production
```

填写以下关键配置:

```bash
# 数据库配置
DB_HOST=你的RDS实例地址.rds.aliyuncs.com
DB_USER=你的数据库用户名
DB_PASSWORD=你的数据库密码
DB_NAME=course_sharing_platform

# OSS配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=你的OSS_AccessKey_ID
OSS_ACCESS_KEY_SECRET=你的OSS_AccessKey_Secret
OSS_BUCKET_NAME=你的OSS_Bucket名称

# JWT密钥
JWT_SECRET=随机生成的32位以上字符串

# CORS配置(使用服务器IP)
CORS_ORIGIN=http://你的服务器IP
```

#### 5. 验证部署

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试后端
curl http://localhost:8080/health
```

在浏览器访问: `http://你的服务器IP`

---

### 方法二: 手动部署(详细控制)

#### 步骤1: 安装Docker

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

#### 步骤2: 克隆项目

```bash
# 创建项目目录
mkdir -p /opt/course-platform
cd /opt

# 克隆项目
git clone https://github.com/aikunkun9527/Course-materials-sharing-platform.git course-platform
cd course-platform
```

#### 步骤3: 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.template .env.production

# 编辑配置
vim .env.production
```

填写:
- 数据库连接信息
- OSS配置信息
- JWT密钥
- CORS配置

#### 步骤4: 构建前端

```bash
cd frontend

# 创建前端环境配置
cat > .env.production << EOF
VITE_API_BASE_URL=http://你的服务器IP/api/v1
VITE_APP_TITLE=课程资料分享平台
EOF

# 构建前端镜像
docker build -t course-platform-frontend:latest .

cd ..
```

#### 步骤5: 构建后端

```bash
cd backend

# 构建后端镜像
docker build -t course-platform-backend:latest .

cd ..
```

#### 步骤6: 启动服务

```bash
# 复制docker-compose配置
cp docker-compose.server.yml docker-compose.yml

# 启动所有服务
docker-compose up -d

# 查看状态
docker-compose ps
```

#### 步骤7: 安装Nginx

```bash
# 安装Nginx
apt install -y nginx

# 复制配置文件
cp nginx-course-platform.conf /etc/nginx/sites-available/course-platform

# 编辑配置,修改域名或IP
vim /etc/nginx/sites-available/course-platform

# 启用配置
ln -sf /etc/nginx/sites-available/course-platform /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx
```

#### 步骤8: 配置防火墙

```bash
# 允许HTTP和HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw --force enable
```

#### 步骤9: 在阿里云控制台配置安全组

1. 进入轻量应用服务器控制台
2. 点击"防火墙"标签
3. 添加规则:
   - 端口: 80, 协议: TCP, 来源: 0.0.0.0/0
   - 端口: 443, 协议: TCP, 来源: 0.0.0.0/0

---

## 验证部署

### 1. 检查服务状态

```bash
cd /opt/course-platform

# 查看容器状态
docker-compose ps

# 应该看到:
# course-backend   running
# course-frontend  running
```

### 2. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs backend

# 查看前端日志
docker-compose logs frontend
```

### 3. 测试API

```bash
# 测试健康检查
curl http://localhost:8080/health

# 应该返回: {"status":"ok"}

# 测试API
curl http://你的服务器IP/api/v1/health
```

### 4. 访问应用

在浏览器打开: `http://你的服务器IP`

---

## 常见问题

### Q1: 容器启动失败?

```bash
# 查看详细错误信息
docker-compose logs backend

# 检查环境变量
cat .env.production

# 检查端口占用
netstat -tlnp | grep 8080
```

### Q2: 无法访问网站?

检查清单:
- [ ] 容器正在运行: `docker-compose ps`
- [ ] Nginx正在运行: `systemctl status nginx`
- [ ] 防火墙已开放80端口: `ufw status`
- [ ] 阿里云安全组已开放80端口

### Q3: 数据库连接失败?

```bash
# 测试数据库连接
mysql -h 你的RDS地址 -u 用户名 -p

# 检查后端环境变量
docker exec course-backend env | grep DB_
```

### Q4: 如何更新应用?

```bash
cd /opt/course-platform

# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up -d
```

---

## 下一步

1. **配置域名**(可选)
   - 购买域名
   - 配置DNS解析到服务器IP
   - 更新Nginx配置中的server_name

2. **启用HTTPS**(推荐)
   ```bash
   # 安装Certbot
   apt install -y certbot python3-certbot-nginx

   # 获取证书
   certbot --nginx -d your-domain.com

   # 自动续期
   certbot renew --dry-run
   ```

3. **配置自动备份**
   - RDS自动备份
   - 定期备份配置文件

4. **性能监控**
   - 安装监控工具
   - 配置告警

---

## 快速命令参考

```bash
# 进入项目目录
cd /opt/course-platform

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 启动服务
docker-compose up -d

# 查看资源使用
docker stats

# 查看Nginx状态
systemctl status nginx

# 重载Nginx
nginx -s reload

# 查看防火墙状态
ufw status
```

---

## 部署架构

```
Internet
    ↓
阿里云轻量应用服务器 (2核2G)
    ↓
Nginx (80/443)
    ├─→ /api → Backend (Docker :8080) → RDS MySQL + OSS
    └─→ /    → Frontend (Docker :3000)
```

---

## 需要帮助?

- 详细文档: `DEPLOY_LIGHTWEIGHT_SERVER.md`
- GitHub Issues: https://github.com/aikunkun9527/Course-materials-sharing-platform/issues
