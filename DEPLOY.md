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
3. 构建配置（在 Dashboard 填写；**仓库内不要提交 `wrangler.toml`**，否则 Cloudflare 会接管绑定管理，Dashboard 将无法增删 D1 绑定）：
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
| `DB_BINDING_NAME` | 条件 | D1 绑定变量名，默认 `DB`；绑定名不同时填写 |

改完环境变量需**重新部署**一次（Create deployment）。

### 4. 绑定 D1 数据库（部署后）

项目 **Settings → Bindings → Add binding → D1 database**：

- Variable name：**任意**，如 `DB` 或 `qncms_db`（代码通过 `DB_BINDING_NAME` 读取实际变量名，默认 `DB`）
- D1 database：选择已创建的数据库（如 `qncms`）

若变量名不是 `DB`，在环境变量中添加 `DB_BINDING_NAME = <变量名>`。绑定后 **Create deployment** 重新部署。

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
| 部署日志 `D1 binding 'DB' references database ... not found` | 某处配置引用了不存在的数据库。确认 Dashboard Bindings 中绑定的数据库真实存在（变量名任意，配合 `DB_BINDING_NAME`） |
| Dashboard 提示「绑定由 wrangler.toml 管理」，无法增删 | 仓库中存在 `wrangler.toml`。模板已删除该文件；若你的仓库里有，删除并重新部署 |
| 后台登录 `Network error` | Functions 未部署成功，查看部署日志；确认构建无报错且 `functions/` 目录存在 |
| 后台登录 `Invalid credentials` | 环境变量问题：用户名/密码不匹配，或 `ADMIN_PASSWORD_HASH` 格式不对（见 README） |
| 后台提示 `Database not available` | D1 绑定缺失；若绑定变量名不是 `DB`，设置 `DB_BINDING_NAME = <变量名>` 后重新部署 |
