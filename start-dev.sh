#!/bin/bash

# 基于云计算的课程资料分享平台 - 本地开发环境启动脚本

echo "========================================"
echo "课程资料分享平台 - 本地开发环境"
echo "========================================"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo ""
echo "步骤1: 启动数据库服务..."
cd docker
docker-compose up -d

echo ""
echo "步骤2: 等待数据库启动..."
sleep 10

echo ""
echo "步骤3: 安装后端依赖..."
cd ../backend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "步骤4: 复制环境变量配置..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建 .env 文件，请根据需要修改配置"
fi

echo ""
echo "步骤5: 启动后端服务..."
npm run dev &
BACKEND_PID=$!

echo ""
echo "========================================"
echo "✅ 开发环境启动成功！"
echo "========================================"
echo ""
echo "服务地址:"
echo "  - 后端API: http://localhost:8080"
echo "  - 健康检查: http://localhost:8080/health"
echo "  - MySQL: localhost:3306"
echo "  - Redis: localhost:6379"
echo "  - MinIO: http://localhost:9001"
echo ""
echo "默认账号:"
echo "  - 数据库: root / root"
echo "  - MinIO: minioadmin / minioadmin"
echo ""
echo "按 Ctrl+C 停止后端服务"
echo ""

# 等待后端进程
wait $BACKEND_PID
