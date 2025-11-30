#!/bin/bash

echo "启动个人作品集网站..."

# 启动后端
echo "启动后端服务器..."
cd portfolio-backend
if [ ! -d "node_modules" ]; then
  echo "安装后端依赖..."
  npm install
fi
npm start &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端
echo "启动前端服务器..."
cd ../portfolio-frontend
if [ ! -d "node_modules" ]; then
  echo "安装前端依赖..."
  npm install
fi
npm run dev &
FRONTEND_PID=$!

echo "后端运行在 http://localhost:3002"
echo "前端运行在 http://localhost:3000"
echo "后台管理 http://localhost:3000/admin"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait


