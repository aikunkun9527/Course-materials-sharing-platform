# 阿里云轻量应用服务器部署指南

## 服务器信息

- 服务器: 阿里云轻量应用服务器
- 区域: cn-shenzhen (华南1 深圳)
- 配置: 2核2G Ubuntu
- 应用: 课程资料分享平台

## 部署架构

```
┌─────────────────────────────────────┐
│   阿里云轻量应用服务器 (2核2G)       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Nginx (反向代理) : 80/443   │  │
│  └──────────────────────────────┘  │
│           ↓           ↓             │
│  ┌────────────┐  ┌─────────────┐   │
│  │  Frontend  │  │   Backend   │   │
│  │  : 3000    │  │   : 8080    │   │
│  └────────────┘  └─────────────┘   │
│                       ↓              │
│              ┌─────────────┐        │
│              │  Docker容器  │        │
│              └─────────────┘        │
└─────────────────────────────────────┘
         ↓                    ↓
    阿里云RDS MySQL      阿里云OSS
```

## 前置要求

### 1. 服务器准备

- ✅ 已创建Ubuntu实例
- ✅ 已设置root密码或SSH密钥
- ⬜ 需要开放端口: 80, 443, 8080(可选)

### 2. 域名准备(可选但推荐)

- 准备域名并解析到服务器公网IP
- 或直接使用IP访问

### 3. 云服务准备

- 阿里云RDS MySQL数据库
- 阿里云OSS存储服务

## 部署步骤

### 第一步: 连接到服务器

#### 方法1: 使用SSH密钥(推荐)
```bash
ssh -i 你的密钥.pem root@你的服务器公网IP
```

#### 方法2: 使用密码
```bash
ssh root@你的服务器公网IP
# 输入密码
```

#### 方法3: 使用阿里云控制台
1. 登录轻量应用服务器控制台
2. 找到你的实例
3. 点击"远程连接" → ""

### 第二步: 更新系统并安装Docker

```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl wget git vim

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 启动Docker
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 第三步: 安装Nginx

```bash
# 安装Nginx
apt install -y nginx

# 启动Nginx
systemctl start nginx
systemctl enable nginx

# 验证
curl http://localhost
```

### 第四步: 准备项目文件

```bash
# 创建项目目录
mkdir -p /opt/course-platform
cd /opt/course-platform

# 克隆项目(或使用Git)
git clone https://github.com/aikunkun9527/Course-materials-sharing-platform.git .
# 或者直接上传项目文件

# 创建环境配置文件
cat > .env.production << 'EOF'
# 数据库配置
DB_HOST=your-rds-mysql-instance.rds.aliyuncs.com
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=course_sharing_platform

# OSS配置
OSS_REGION=oss-cn-shenzhen
OSS_ACCESS_KEY_ID=your_oss_access_key_id
OSS_ACCESS_KEY_SECRET=your_oss_access_key_secret
OSS_BUCKET_NAME=your_bucket_name

# JWT密钥 (使用随机字符串)
JWT_SECRET=$(openssl rand -base64 32)

# CORS配置
CORS_ORIGIN=https://your-domain.com
# 或使用IP: CORS_ORIGIN=http://你的服务器IP

# 应用配置
NODE_ENV=production
PORT=8080
EOF
```

编辑环境配置:
```bash
vim .env.production
# 填写你的数据库和OSS配置
```

### 第五步: 构建Docker镜像

```bash
# 构建后端镜像
cd /opt/course-platform/backend
docker build -t course-platform-backend:latest .

# 构建前端镜像
cd /opt/course-platform/frontend
# 先创建生产环境配置
cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://your-domain.com/api/v1
# 或使用IP: VITE_API_BASE_URL=http://你的服务器IP/api/v1
VITE_APP_TITLE=课程资料分享平台
EOF

docker build -t course-platform-frontend:latest .
```

### 第六步: 创建Docker Compose配置

在 `/opt/course-platform` 创建 `docker-compose.yml`:

```bash
cd /opt/course-platform
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: course-platform-backend:latest
    container_name: course-backend
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "8080:8080"
    volumes:
      - backend-logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    networks:
      - course-network

  frontend:
    image: course-platform-frontend:latest
    container_name: course-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - course-network

volumes:
  backend-logs:

networks:
  course-network:
    driver: bridge
EOF
```

### 第七步: 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 第八步: 配置Nginx反向代理

创建Nginx配置:

```bash
cat > /etc/nginx/sites-available/course-platform << 'EOF'
# 后端API
server {
    listen 80;
    server_name your-domain.com;  # 或使用服务器IP

    # API请求代理到后端
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS配置(如果需要)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/course-platform /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载Nginx
systemctl reload nginx
```

### 第九步: 配置防火墙

```bash
# 允许HTTP和HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 如果需要直接访问后端(生产环境不推荐)
# ufw allow 8080/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

### 第十步: 在阿里云控制台配置安全组

1. 登录轻量应用服务器控制台
2. 找到你的实例
3. 点击"防火墙"或"安全组"
4. 添加规则:
   - 端口: 80, 协议: TCP, 来源: 0.0.0.0/0
   - 端口: 443, 协议: TCP, 来源: 0.0.0.0/0

### 第十一步: 验证部署

```bash
# 测试后端健康
curl http://localhost:8080/health

# 测试Nginx
curl http://localhost

# 从外部测试(在本地电脑)
curl http://你的服务器IP/api/v1/health
```

访问浏览器: `http://你的服务器IP`

### 第十二步: (可选) 配置HTTPS

使用Let's Encrypt免费证书:

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书(需要域名)
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

## 管理命令

### 查看服务状态
```bash
cd /opt/course-platform
docker-compose ps
```

### 查看日志
```bash
# 所有服务
docker-compose logs -f

# 仅后端
docker-compose logs backend

# 仅前端
docker-compose logs frontend
```

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose down
```

### 更新服务
```bash
cd /opt/course-platform

# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 重启服务
docker-compose up -d
```

## 性能优化

### 1. 配置Swap(2核2G建议)
```bash
# 创建2GB swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2. 优化Docker
```bash
# 创建daemon.json
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启Docker
systemctl restart docker
```

### 3. 优化Nginx
```bash
# 编辑nginx.conf
vim /etc/nginx/nginx.conf

# 添加以下配置到http块
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

## 监控

### 查看资源使用
```bash
# 系统资源
htop

# Docker资源
docker stats

# 磁盘使用
df -h

# 内存使用
free -h
```

### 设置日志轮转
```bash
cat > /etc/logrotate.d/course-platform << 'EOF'
/opt/course-platform/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
EOF
```

## 备份

### 数据库备份
```bash
# 使用阿里云RDS自动备份功能
# 或手动备份
mysqldump -h your-rds-host -u user -p database_name > backup.sql
```

### 应用备份
```bash
# 备份配置
tar -czf course-platform-config-$(date +%Y%m%d).tar.gz .env.production docker-compose.yml
```

## 故障排查

### 问题1: 容器无法启动
```bash
# 查看详细日志
docker-compose logs backend

# 检查端口占用
netstat -tlnp | grep 8080

# 检查环境变量
docker-compose config
```

### 问题2: 无法访问
```bash
# 检查Nginx
nginx -t
systemctl status nginx

# 检查防火墙
ufw status

# 检查Docker容器
docker ps
```

### 问题3: 数据库连接失败
```bash
# 测试数据库连接
mysql -h your-rds-host -u user -p

# 检查环境变量
docker exec course-backend env | grep DB_
```

## 成本估算

- **轻量应用服务器**: ¥60-100/月 (2核2G)
- **RDS MySQL**: ¥30-50/月
- **OSS存储**: 基本免费
- **流量费用**: 包含在服务器费用中
- **总计**: 约 ¥90-150/月

## 下一步

1. 配置域名和DNS
2. 启用HTTPS
3. 配置自动备份
4. 设置监控告警
5. 性能调优

## 快速部署脚本

创建一键部署脚本 `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "开始部署课程资料分享平台..."

# 更新系统
apt update && apt upgrade -y

# 安装Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 安装Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 克隆项目
if [ ! -d "/opt/course-platform" ]; then
    mkdir -p /opt/course-platform
    cd /opt
    git clone https://github.com/aikunkun9527/Course-materials-sharing-platform.git course-platform
fi

cd /opt/course-platform

# 提示配置环境变量
echo "请配置环境变量 (.env.production)"
vim .env.production

# 构建并启动
docker-compose up -d

echo "部署完成!"
echo "访问地址: http://$(curl -s ifconfig.me)"
```

使用方法:
```bash
chmod +x deploy.sh
./deploy.sh
```
