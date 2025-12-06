#!/bin/bash

# 快速部署脚本 - 将代码同步到 GitHub

echo "=========================================="
echo "🚀 开始同步代码到 GitHub"
echo "=========================================="
echo ""

# 检查是否已添加 GitHub 远程仓库
if git remote | grep -q "github"; then
    echo "✅ GitHub 远程仓库已存在"
    git remote -v | grep github
else
    echo "⚠️  未找到 GitHub 远程仓库"
    echo ""
    echo "请先执行以下命令添加 GitHub 远程仓库："
    echo "git remote add github https://github.com/YOUR_USERNAME/personal-web.git"
    echo ""
    echo "（将 YOUR_USERNAME 替换为你的 GitHub 用户名）"
    exit 1
fi

echo ""
echo "📤 开始推送到 GitHub..."
echo ""

# 推送到 GitHub
git push github main

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 代码已成功推送到 GitHub！"
    echo "=========================================="
    echo ""
    echo "下一步："
    echo "1. 访问 https://render.com 注册账号"
    echo "2. 连接 GitHub 仓库"
    echo "3. 按照《完整部署指南.md》进行部署"
else
    echo ""
    echo "=========================================="
    echo "❌ 推送失败"
    echo "=========================================="
    echo ""
    echo "可能的原因："
    echo "1. GitHub 认证失败（需要使用 Personal Access Token）"
    echo "2. 网络问题"
    echo ""
    echo "解决方法："
    echo "1. 访问 https://github.com/settings/tokens 生成 token"
    echo "2. 推送时，密码处输入 token"
fi
