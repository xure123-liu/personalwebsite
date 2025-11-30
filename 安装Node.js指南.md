# Node.js 安装指南

## 问题
出现错误：`zsh: command not found: npm`

这表示您的 Mac 上还没有安装 Node.js 和 npm。

## 解决方案

### 方式一：从官网下载安装（推荐，最简单）

1. **访问 Node.js 官网**
   - 打开浏览器，访问：https://nodejs.org/
   - 或者直接访问：https://nodejs.org/zh-cn/download/

2. **下载安装包**
   - 选择 "macOS Installer (.pkg)"
   - 选择 LTS 版本（长期支持版本，更稳定）
   - 下载完成后，双击 `.pkg` 文件

3. **安装**
   - 按照安装向导的提示完成安装
   - 安装完成后，重启终端

4. **验证安装**
   ```bash
   node -v
   npm -v
   ```
   如果显示版本号，说明安装成功！

### 方式二：使用 Homebrew（如果网络允许）

如果您想使用 Homebrew，可以尝试：

1. **安装 Homebrew**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   
   如果网络连接失败，可以：
   - 使用 VPN
   - 或者使用国内镜像源

2. **使用 Homebrew 安装 Node.js**
   ```bash
   brew install node
   ```

3. **验证安装**
   ```bash
   node -v
   npm -v
   ```

### 方式三：使用 nvm（Node Version Manager）

如果您需要管理多个 Node.js 版本：

1. **安装 nvm**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **重新加载终端配置**
   ```bash
   source ~/.zshrc
   ```

3. **安装 Node.js**
   ```bash
   nvm install --lts
   nvm use --lts
   ```

4. **验证安装**
   ```bash
   node -v
   npm -v
   ```

## 安装完成后

安装完成后，您就可以运行项目了：

```bash
# 进入后端目录
cd "/Users/liuyou/Downloads/斜杠/个人web网站/portfolio-backend"
npm install
npm start

# 新开一个终端，进入前端目录
cd "/Users/liuyou/Downloads/斜杠/个人web网站/portfolio-frontend"
npm install
npm run dev
```

## 常见问题

### 1. 安装后仍然提示 command not found

**解决方法：**
- 重启终端应用
- 或者重新打开终端窗口
- 检查 PATH 环境变量：
  ```bash
  echo $PATH
  ```

### 2. 权限问题

如果遇到权限问题，可能需要：
```bash
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### 3. 版本检查

安装完成后，检查版本：
```bash
node -v   # 应该显示 v18.x.x 或更高版本
npm -v    # 应该显示 9.x.x 或更高版本
```

## 推荐版本

- **Node.js**: v18.x LTS 或 v20.x LTS
- **npm**: 会自动随 Node.js 一起安装

## 下一步

安装完成后，请按照 `测试指南.md` 中的步骤启动和测试项目。

