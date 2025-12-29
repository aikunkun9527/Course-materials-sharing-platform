@echo off
REM 基于云计算的课程资料分享平台 - Windows本地开发环境启动脚本

echo ========================================
echo 课程资料分享平台 - 本地开发环境
echo ========================================

REM 检查Docker是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker未安装，请先安装Docker Desktop
    pause
    exit /b 1
)

echo.
echo 步骤1: 启动数据库服务...
cd docker
docker-compose up -d

echo.
echo 步骤2: 等待数据库启动...
timeout /t 10 /nobreak >nul

echo.
echo 步骤3: 安装后端依赖...
cd ..\backend
if not exist "node_modules" (
    call npm install
)

echo.
echo 步骤4: 复制环境变量配置...
if not exist ".env" (
    copy .env.example .env
    echo 已创建 .env 文件，请根据需要修改配置
)

echo.
echo 步骤5: 启动后端服务...
start "后端服务" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ 开发环境启动成功！
echo ========================================
echo.
echo 服务地址:
echo   - 后端API: http://localhost:8080
echo   - 健康检查: http://localhost:8080/health
echo   - MySQL: localhost:3306
echo   - Redis: localhost:6379
echo   - MinIO: http://localhost:9001 (控制台)
echo   - MinIO API: http://localhost:9000
echo.
echo 默认账号:
echo   - 数据库: root / root
echo   - MinIO: minioadmin / minioadmin
echo.
echo 后端服务已在新窗口启动
echo 请查看该窗口了解后端运行状态
echo.

pause
