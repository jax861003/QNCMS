# QNCMS — 企业官网内容管理系统

基于 **Astro 4 + Cloudflare Pages Functions + D1** 的企业官网 CMS 模板：静态前端 + 无服务器后端，前后端分离，内置多语言与后台产品管理。

**技术栈**：Astro 4.x（静态生成） · Cloudflare Pages（托管 + Functions 后端） · D1（SQLite 数据库） · JWT 认证

---

## 特性

- 🌐 **多语言**：内置 `en` / `zh`（URL 前缀 `/en/...` `/zh/...`），右上角**下拉菜单**切换；新增语言只需改一处配置 + 复制页面目录（见下方「添加新语言」）
- 🛒 **产品管理后台**：`/admin` 登录后增删改产品，写入 D1 实时生效，无需重新部署
- 🔌 **前后端分离**：`functions/` 提供 REST API，静态页面通过 API 读取数据；无 D1 绑定或表为空时自动回退到内置示例数据，站点永不空白
- 🗄️ **D1 自动建表**：数据库绑定后首次请求自动创建 `products` / `settings` 表，**无需手动执行迁移**
- 🔑 **灵活的登录凭证**：支持明文密码（`ADMIN_PASSWORD`，推荐）或 SHA-256 哈希（`ADMIN_PASSWORD_HASH`），见「环境变量」
- 🌙 **暗黑模式**：右上角一键切换，`localStorage` 记忆选择，跟随系统偏好作为默认值
- 🖼️ **外链产品图**：图片使用 URL，无需对象存储，零额外费用
- ⚡ **Cloudflare CDN**：全球边缘节点、自动 HTTPS，Git 推送即部署
- 📱 **响应式**：全设备适配，移动端汉堡菜单
- 🎨 **设计系统**：CSS 变量驱动，亮/暗双主题，可一键换色

---

## 快速开始

### 1. 克隆并安装

```bash
git clone https://github.com/jax861003/QNCMS.git
cd QNCMS
npm install
```

### 2. 本地开发

```bash
npm run dev          # 纯前端开发（Astro dev server）
```

```bash
npm run build        # 构建到 dist/
npx wrangler pages dev dist \
  --binding=ADMIN_USERNAME=admin \
  --binding=ADMIN_PASSWORD=admin123 \
  --binding=JWT_SECRET=dev-secret \
  --d1=DB=<你的D1数据库ID>   # 可选，模拟 D1 绑定
```

访问：
- 首页：`http://localhost:4321/en/`
- Admin 面板：`http://localhost:4321/admin/`（Pages dev 模式端口见 wrangler 输出，默认 8788）

### 3. 部署到 Cloudflare Pages

> **部署逻辑说明**：这是一个模板项目，`<your-project>.pages.dev` 域名只有在项目**部署到 Cloudflare 之后**才会由 Cloudflare 自动分配；部署前该域名不存在是正常的。部署成功后按项目名分配，如项目名为 `qncms`，则公网域名为 `https://qncms.pages.dev`。

1. 将代码推送到你的 GitHub 仓库（或直接 fork 本仓库）：
   ```bash
   git remote add origin https://github.com/<your-username>/QNCMS.git
   git push -u origin main
   ```
2. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**，选择该仓库，分支 `main`。
3. 构建配置（模板已内置，无需改动 `wrangler.toml`）：
   - 框架预设：**Astro**
   - 构建命令：`npm run build`
   - 输出目录：`dist`
4. 点击 **Save and Deploy**。部署成功后 Cloudflare 分配公网域名 `https://<project-name>.pages.dev`。
5. **部署完成后**，在项目 **Settings → Environment variables** 添加环境变量（见下表）。
6. 在项目 **Settings → Bindings → Add binding → D1 database** 添加数据库绑定：
   - Variable name（变量名）：**`DB`**（代码固定读取 `env.DB`，不可改名）
   - D1 database：选择你已创建的数据库（如 `qncms`）
   - 添加后点 **Create deployment** 重新部署一次，让绑定生效。
7. 完成。数据表会在首次请求 API 时**自动创建**，无需任何迁移命令。

---

## 环境变量说明

全部在 Cloudflare Pages 项目 **Settings → Environment variables** 中配置（**不要**写进 `wrangler.toml`，避免占位符覆盖线上配置）。

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `ADMIN_USERNAME` | ✓ | 管理员登录用户名 |
| `ADMIN_PASSWORD` | 推荐 | **明文密码**（最简单，方便记忆）。设置了它，登录直接用该值 |
| `ADMIN_PASSWORD_HASH` | 二选一 | 密码的 SHA-256 小写十六进制（64 字符）。若填的是**其他任意值**，也会被直接当作明文密码比对 |
| `JWT_SECRET` | ✓ | 会话签名密钥，任意随机字符串即可 |

> 凭证优先级：`ADMIN_PASSWORD`（明文）→ `ADMIN_PASSWORD_HASH`（64 位 hex 按哈希比对，否则按明文比对）。

生成 SHA-256 哈希（如改用哈希方式）：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"
```

---

## Admin 面板

- 访问：`https://<your-project>.pages.dev/admin/`
- 登录：`ADMIN_USERNAME` + 密码（`ADMIN_PASSWORD` 或对应 `ADMIN_PASSWORD_HASH` 的明文）
- 功能：新增 / 编辑 / 删除产品（双语字段、排序、图片 URL），保存即写入 D1

### 产品字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `slug` | ✓ | 唯一标识，用于产品页 URL，如 `nova-ingest` |
| `name_en` / `name_zh` | ✓ | 英文 / 中文名称 |
| `short_en` / `short_zh` | ✓ | 简短描述（列表页显示） |
| `description_en` / `description_zh` | 可选 | 详细描述（详情页显示） |
| `highlights_en` / `highlights_zh` | 可选 | JSON 数组，如 `["快速", "稳定"]` |
| `image_url` | ✓ | 产品图片外链地址（建议 800×600px） |
| `position` | 可选 | 排序权重，越小越靠前 |

---

## 文件结构

```
QNCMS/
├── functions/                  # Cloudflare Pages Functions（后端 API）
│   ├── _utils.js               # 认证 / 环境变量 / 自动建表工具
│   └── api/
│       ├── auth.js             # POST /api/auth 登录
│       ├── me.js               # GET /api/me 会话状态
│       ├── products.js         # GET /api/products 产品列表（D1→示例数据回退）
│       │                       # POST /api/products 新增/更新（需认证）
│       ├── products/
│       │   ├── create.js       # POST /api/products/create（需认证）
│       │   └── delete.js       # DELETE /api/products/delete?slug=（需认证）
│       ├── admin/
│       │   └── products.js     # GET /api/admin/products 双语完整数据（需认证）
│       ├── settings.js         # GET/POST /api/settings 站点设置（需认证）
│       └── contact.js          # POST /api/contact 联系表单
├── src/
│   ├── i18n/
│   │   ├── en.json             # 英文文案
│   │   └── zh.json             # 中文文案
│   ├── data/
│   │   └── products.json       # 内置示例产品（D1 未绑定/为空时的回退数据）
│   ├── lib/
│   │   ├── i18n.ts             # 国际化配置（locales / localeNames / dict）
│   │   ├── products.ts         # 产品数据读取
│   │   └── api.ts              # API 调用封装
│   ├── layouts/
│   │   └── BaseLayout.astro    # 全局布局（含暗黑模式防闪烁脚本）
│   ├── components/
│   │   ├── Header.astro        # 导航栏（语言下拉 + 暗黑模式按钮）
│   │   ├── Footer.astro        # 页脚
│   │   ├── Hero.astro          # 首页横幅
│   │   ├── ProductGrid.astro   # 产品网格
│   │   └── ...                 # 其余区块组件
│   ├── styles/
│   │   └── global.css          # 设计系统 CSS 变量（亮/暗主题）
│   └── pages/
│       ├── index.astro         # 根路由（按浏览器语言跳转 /en/ 或 /zh/）
│       ├── 404.astro           # 404 页面
│       ├── admin/index.astro   # 管理面板
│       ├── en/                 # 英文页面（index / products / about / contact）
│       └── zh/                 # 中文页面（同结构）
├── public/
│   ├── images/                 # 静态资源（产品示例图、hero 图）
│   ├── scripts/site.js         # 客户端脚本（暗黑模式切换等）
│   ├── favicon.svg
│   ├── robots.txt
│   └── _redirects              # Pages 重定向规则（/admin → /admin/）
├── wrangler.toml               # 仅构建配置（无 D1 绑定、无 secrets）
├── wrangler.migrations/        # DDL 参考（现已由运行时自动建表替代）
├── astro.config.mjs            # Astro 配置（site 域名在此修改）
└── package.json
```

---

## 定制说明

### 修改站点域名（canonical / SEO）

编辑 `astro.config.mjs`：

```js
site: 'https://<your-project>.pages.dev',   // 改为你部署后得到的域名
```

> 该值只影响 SEO 规范链接等绝对 URL，不影响页面功能与语言跳转。

### 品牌与文案

编辑 `src/i18n/{en,zh}.json`（品牌名、标题、口号等文案），以及 `src/data/products.json`（示例产品）。

### 暗黑模式配色

编辑 `src/styles/global.css` 顶部的 CSS 变量，亮色在 `:root`，暗色在 `html[data-theme="dark"]`：

```css
:root { --bg: #ffffff; --text: #111827; }
html[data-theme="dark"] { --bg: #0b1220; --text: #e5e7eb; }
```

### 添加新语言（如俄语 / 韩语）

以添加俄语 `ru` 为例，全部改动集中在 4 处：

1. 复制 `src/i18n/zh.json` 为 `src/i18n/ru.json`，翻译所有键值；
2. 在 `src/lib/i18n.ts` 中注册：
   ```ts
   import ru from '@/i18n/ru.json';
   export const locales = ['en', 'zh', 'ru'] as const;
   export const localeNames: Record<Locale, string> = { en: 'English', zh: '中文', ru: 'Русский' };
   const dict: Record<Locale, typeof en> = { en, zh, ru };
   ```
3. 复制 `src/pages/zh/` 目录为 `src/pages/ru/`，把页面 frontmatter 中的 `locale = 'zh'` 改为 `locale = 'ru'`；
4. 如需产品/站点文案也支持该语言，在后台产品编辑中补充 `*_ru` 字段（API 已按 locale 参数透传）。

> 语言下拉菜单会自动读取 `localeNames` 渲染新选项，无需改组件。

---

## API 一览

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth` | 否 | 登录，返回 token（body: `{username, password}`） |
| GET | `/api/me` | Bearer token | 当前会话状态 |
| GET | `/api/products?locale=en&slug=` | 否 | 产品列表 / 单个产品（公开） |
| POST | `/api/products` | Bearer token | 新增或更新产品 |
| POST | `/api/products/create` | Bearer token | 新增产品（别名） |
| DELETE | `/api/products/delete?slug=x` | Bearer token | 删除产品 |
| GET | `/api/admin/products` | Bearer token | 双语完整字段（后台编辑用） |
| GET/POST | `/api/settings` | Bearer token | 站点设置读写 |
| POST | `/api/contact` | 否 | 联系表单 |

> 认证方式：请求头 `Authorization: Bearer <token>`（后台登录后自动附带）。

---

## 常见问题

### Q: 部署前访问 `<project>.pages.dev` 打不开 / 域名不存在？

正常现象。`pages.dev` 域名是**部署成功后才分配**的。部署完成后访问 `https://<project-name>.pages.dev`。

### Q: 后台登录提示 `Invalid credentials`？

检查环境变量：
- 确认 `ADMIN_USERNAME` 与输入的用户名一致；
- 若用明文：配置 `ADMIN_PASSWORD`，登录输入该明文；
- 若用哈希：`ADMIN_PASSWORD_HASH` 必须是密码的 SHA-256 小写十六进制（64 字符），或直接填明文密码（代码会自动按明文比对）；
- 改完环境变量后需在 Cloudflare 重新部署一次。

### Q: 后台提示「Database not available」？

D1 绑定未生效。到项目 **Settings → Bindings** 确认存在变量名为 **`DB`** 的 D1 绑定，绑定后重新部署。

### Q: 后台产品列表为空 / 提示执行迁移？

首次请求已会自动建表（`products` / `settings`）。若仍为空，确认 D1 绑定名是 `DB` 且已重新部署；之后通过后台「+ Add Product」新增即可。也可手动初始化：
`npx wrangler d1 execute <database-name> --remote --file=wrangler.migrations/001_init.sql`

### Q: 修改产品后需要重新部署吗？

不需要。后台保存即写入 D1，API 实时返回新数据。

### Q: 产品图不显示？

图片使用外链 URL（`image_url`）。确保地址可公开访问、支持 HTTPS，且填写在后台产品的「Image URL」字段。示例数据中的图片路径为 `/images/products/*.png`，随站点托管在 Cloudflare。

### Q: 能自定义域名吗？

可以。Cloudflare Pages 支持绑定自定义域名（Workers & Pages → 项目 → Custom domains），绑定后记得把 `astro.config.mjs` 的 `site` 改为新域名。

---

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Astro 文档](https://docs.astro.build/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

## 许可证

MIT License
