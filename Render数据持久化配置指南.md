# Render 后端数据持久化配置指南

## 问题原因

Render 默认使用**临时文件系统**（Ephemeral Filesystem）：每次服务重启或重新部署，容器会重建，**所有本地文件（包括 SQLite 数据库和上传的图片）都会被清空**，所以你会看到“更新数据后时不时被清空重置”。

要稳定保存数据，必须把数据库和上传目录放到 **Render 持久化磁盘（Persistent Disk）** 上。

---

## 解决步骤（在 Render Dashboard 操作）

### 前提说明

- **持久化磁盘仅支持付费计划**（如 Starter 等）。若当前是 Free 计划，需先升级到付费计划才能在服务上添加磁盘。
- 若暂时不升级，数据仍会在每次重启/部署后丢失；升级并按下面配置后，数据会稳定保存。

### 步骤 1：为后端服务添加持久化磁盘

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 进入你的 **后端服务**（如 `portfolio-backend`）
3. 在左侧或顶部找到 **「Disks」** 或 **「磁盘」**
4. 点击 **「Add Disk」** / **「添加磁盘」**
5. 填写：
   - **Name**：`portfolio-data`（或任意名称）
   - **Mount Path**：**`/data`**（必须填 `/data`，与代码中 `DATA_DIR` 一致）
   - **Size**：选择 **1 GB**（可按需选更大）
6. 保存后，Render 会触发一次重新部署，磁盘会在部署完成后挂载到 `/data`。

### 步骤 2：设置环境变量 DATA_DIR

1. 在同一后端服务的 **「Environment」** / **「环境变量」** 页面
2. 点击 **「Add Environment Variable」** / **「添加环境变量」**
3. 添加：
   - **Key**：`DATA_DIR`
   - **Value**：`/data`
4. 保存。Render 会再次部署，使新环境变量生效。

### 步骤 3：确认配置

- 部署完成后，在 **「Logs」** 里应看到类似输出：
  - `DATA_DIR: /data`
  - `Connected to SQLite database at: /data/portfolio.db`
  - `数据持久化已启用，数据将保存在持久化存储中`
- 在后台更新一些数据，然后手动 **重启服务** 或触发一次 **重新部署**，再刷新前端：数据应仍然存在。

---

## 配置要点小结

| 项目       | 值        |
|------------|-----------|
| 磁盘挂载路径 | `/data`   |
| 环境变量     | `DATA_DIR=/data` |
| 数据库文件   | `/data/portfolio.db` |
| 上传目录     | `/data/uploads` |

只要 **Mount Path** 与 **DATA_DIR** 都是 `/data`，后端会把 SQLite 和上传文件都写到持久化磁盘上，数据即可稳定保存并与前端正常同步。

---

## 若无法添加磁盘（例如坚持用 Free 计划）

Free 计划不支持持久化磁盘，因此：

- 要么升级到付费计划并按上述步骤配置磁盘与 `DATA_DIR`；
- 要么考虑把后端迁到支持免费持久化存储的平台（例如 Railway 免费版 + Volume），或改用外部数据库（如 Render 免费 Postgres）+ 对象存储存图片（需改代码）。

当前仓库中的 `render.yaml` 已包含 `DATA_DIR=/data` 和 `disk.mountPath: /data` 的配置，在 Dashboard 里按上面步骤添加磁盘并设置环境变量即可生效。
