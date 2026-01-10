#!/bin/bash

# 课程资料分享平台 - 一键部署脚本
# 适用于阿里云轻量应用服务器 (Ubuntu 2核2G)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root用户运行此脚本"
        exit 1
    fi
}

# 检查系统
check_system() {
    log_info "检查系统..."
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        log_info "检测到操作系统: $PRETTY_NAME"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    apt update && apt upgrade -y
}

# 安装基础工具
install_basic_tools() {
    log_info "安装基础工具..."
    apt install -y curl wget git vim ufw htop net-tools
}

# 安装Docker
install_docker() {
    if command -v docker &> /dev/null; then
        log_info "Docker已安装，版本: $(docker --version)"
    else
        log_info "安装Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh

        systemctl start docker
        systemctl enable docker

        log_info "Docker安装完成: $(docker --version)"
    fi
}

# 安装Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        log_info "Docker Compose已安装，版本: $(docker-compose --version)"
    else
        log_info "安装Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose

        log_info "Docker Compose安装完成: $(docker-compose --version)"
    fi
}

# 安装Nginx
install_nginx() {
    if command -v nginx &> /dev/null; then
        log_info "Nginx已安装，版本: $(nginx -v 2>&1)"
    else
        log_info "安装Nginx..."
        apt install -y nginx
        systemctl start nginx
        systemctl enable nginx

        log_info "Nginx安装完成"
    fi
}

# 配置Swap
configure_swap() {
    if [ -f /swapfile ]; then
        log_info "Swap文件已存在"
    else
        log_info "创建2GB Swap文件..."
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile

        # 永久生效
        echo '/swapfile none swap sw 0 0' >> /etc/fstab

        log_info "Swap配置完成"
    fi
}

# 创建项目目录
create_project_dir() {
    log_info "创建项目目录..."
    mkdir -p /opt/course-platform
    cd /opt/course-platform
}

# 克隆项目
clone_project() {
    if [ -d "/opt/course-platform/backend" ]; then
        log_warn "项目目录已存在，跳过克隆"
        cd /opt/course-platform
        log_info "更新项目代码..."
        git pull
    else
        log_info "克隆项目..."
        cd /opt
        git clone https://github.com/aikunkun9527/Course-materials-sharing-platform.git course-platform
        cd /opt/course-platform
    fi
}

# 配置环境变量
configure_env() {
    log_info "配置环境变量..."

    if [ -f ".env.production" ]; then
        log_warn ".env.production已存在"
        read -p "是否重新配置? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm .env.production
        else
            return
        fi
    fi

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

# JWT密钥
JWT_SECRET=your_jwt_secret_min_32_characters

# CORS配置
CORS_ORIGIN=http://YOUR_SERVER_IP

# 应用配置
NODE_ENV=production
PORT=8080
EOF

    log_warn "请编辑 .env.production 文件并填写正确的配置"
    vim .env.production
}

# 构建Docker镜像
build_images() {
    log_info "构建后端Docker镜像..."
    cd /opt/course-platform/backend
    docker build -t course-platform-backend:latest .

    log_info "构建前端Docker镜像..."

    # 创建前端环境配置
    read -p "请输入服务器IP或域名: " SERVER_ADDRESS

    cat > .env.production << EOF
VITE_API_BASE_URL=http://${SERVER_ADDRESS}/api/v1
VITE_APP_TITLE=课程资料分享平台
EOF

    cd /opt/course-platform/frontend
    docker build -t course-platform-frontend:latest .

    cd /opt/course-platform
}

# 启动服务
start_services() {
    log_info "启动服务..."

    # 复制docker-compose配置
    cp docker-compose.server.yml docker-compose.yml

    # 启动
    docker-compose up -d

    log_info "等待服务启动..."
    sleep 10

    # 检查状态
    docker-compose ps
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp

    log_info "防火墙配置完成"
    ufw status
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."

    read -p "请输入域名或服务器IP: " DOMAIN

    cat > /etc/nginx/sites-available/course-platform << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # API请求代理到后端
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 前端应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/course-platform /etc/nginx/sites-enabled/

    # 测试配置
    nginx -t

    # 重载Nginx
    systemctl reload nginx

    log_info "Nginx配置完成"
}

# 显示部署信息
show_info() {
    SERVER_IP=$(curl -s ifconfig.me)

    echo ""
    echo "=========================================="
    echo "        部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址: http://$SERVER_IP"
    echo "项目目录: /opt/course-platform"
    echo ""
    echo "常用命令:"
    echo "  查看服务状态: cd /opt/course-platform && docker-compose ps"
    echo "  查看日志: cd /opt/course-platform && docker-compose logs -f"
    echo "  重启服务: cd /opt/course-platform && docker-compose restart"
    echo "  停止服务: cd /opt/course-platform && docker-compose down"
    echo ""
    echo "下一步:"
    echo "  1. 配置域名DNS解析"
    echo "  2. 安装SSL证书: apt install certbot python3-certbot-nginx"
    echo "  3. 运行: certbot --nginx -d your-domain.com"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "  课程资料分享平台 - 一键部署脚本"
    echo "  阿里云轻量应用服务器 (Ubuntu 2核2G)"
    echo "=========================================="
    echo ""

    check_root
    check_system

    # 询问是否继续
    read -p "是否开始部署? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "取消部署"
        exit 0
    fi

    # 开始部署
    update_system
    install_basic_tools
    install_docker
    install_docker_compose
    install_nginx
    configure_swap
    create_project_dir
    clone_project
    configure_env
    build_images
    start_services
    configure_firewall
    configure_nginx

    show_info

    log_info "部署成功!"
}

# 运行主函数
main
