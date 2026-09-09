# QNCMS — 部署指南（Cloudflare Pages）

> 快速部署说明；完整文档见 [README.md](README.md)。

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git remote add origin https://github.com/<your-username>/QNCMS.git
git push -u origin main
```

### 2. 在 Cloudflare 创建 Pages 项目

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. 选择仓库与分支（`main`）
3. 构建配置：
   - 框架预设：**Astro**
   - 构建命令：`npm run build`
   - 输出目录：`dist`
4. **Save and Deploy**

> 部署成功后 Cloudflare 自动分配公网域名：`https://<project-name>.pages.dev`（部署前该域名不存在属正常现象）。

### 3. 配置环境变量（部署后）

项目 **Settings → Environment variables**：

| 变量 | 必填 | 示例 |
|------|------|------|
| `ADMIN_USERNAME` | ✓ | `admin` |
| `ADMIN_PASSWORD` | 推荐（明文） | `your-password` |
| `ADMIN_PASSWORD_HASH` | 二选一 | 密码 SHA-256 小写 hex，或任意明文 |
| `JWT_SECRET` | ✓ | 随机字符串，如 `x9Kp2mQv8sTz...` |

改完环境变量需**重新部署**一次（Create deployment）。

### 4. 绑定 D1 数据库（部署后）

项目 **Settings → Bindings → Add binding → D1 database**：

- Variable name：**`DB`**（必须与代码一致，不可改名）
- D1 database：选择已创建的数据库

绑定后 **Create deployment** 重新部署。

> 数据表（`products` / `settings`）会在首次请求 API 时自动创建，无需手动迁移。
> 如需手动建表（可选）：
> ```bash
> npx wrangler d1 execute <database-name> --remote --file=wrangler.migrations/001_init.sql
> ```

### 5. 完成

- 前台：`https://<project-name>.pages.dev/`
- 后台：`https://<project-name>.pages.dev/admin/`

## 本地开发（含 Functions）

```bash
npm install
npm run build
npx wrangler pages dev dist \
  --binding=ADMIN_USERNAME=admin \
  --binding=ADMIN_PASSWORD=admin123 \
  --binding=JWT_SECRET=dev-secret \
  --d1=DB=<你的D1数据库ID>   # 可选
```

## 常见部署报错

| 现象 | 原因 / 解决 |
|------|-------------|
| 部署日志 `D1 binding 'DB' references database ... not found` | `wrangler.toml` 中配置了 D1 绑定但构建环境无法解析。模板已移除该配置；请在 Dashboard 绑定，不要写进 `wrangler.toml` |
| 后台登录 `Network error` | Functions 未部署成功，查看部署日志；确认构建无报错且 `functions/` 目录存在 |
| 后台登录 `Invalid credentials` | 环境变量问题：用户名/密码不匹配，或 `ADMIN_PASSWORD_HASH` 格式不对（见 README） |
| 后台提示 `Database not available` | D1 绑定缺失或变量名不是 `DB`，重新绑定并部署 |
