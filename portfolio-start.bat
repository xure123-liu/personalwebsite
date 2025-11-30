@echo off
echo 启动个人作品集网站...

REM 启动后端
echo 启动后端服务器...
cd portfolio-backend
if not exist node_modules (
  echo 安装后端依赖...
  call npm install
)
start "Backend Server" cmd /k "npm start"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端
echo 启动前端服务器...
cd ..\portfolio-frontend
if not exist node_modules (
  echo 安装前端依赖...
  call npm install
)
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 后端运行在 http://localhost:3002
echo 前端运行在 http://localhost:3000
echo 后台管理 http://localhost:3000/admin
echo.
echo 关闭窗口即可停止服务
pause


