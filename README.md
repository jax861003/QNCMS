# QNCMS — 企业官网内容管理系统

基于 **Astro 4 + Cloudflare Pages Functions + D1** 的企业官网 CMS 模板：静态前端 + 无服务器后端，前后端分离，内置多语言与后台产品管理。

**技术栈**：Astro 4.x（静态生成） · Cloudflare Pages（托管 + Functions 后端） · D1（SQLite 数据库） · JWT 认证

---

## 特性

- 🌐 **多语言**：内置 `en` / `zh`（URL 前缀 `/en/...` `/zh/...`），右上角**下拉菜单**切换；后台管理界面也支持**中英文一键切换**；新增语言只需改一处配置 + 复制页面目录（见下方「添加新语言」）
- 🛒 **产品管理后台**：`/admin` 登录后增删改产品，写入 D1 实时生效；支持**价格、购买链接**字段（非必填）；后台支持**列表 / 缩略图 / 表格**三种视图切换，三种视图均支持**关键词搜索、分类筛选、勾选批量删除**，表格视图可在表格下方固定显示**列设置面板**；产品支持**中英文分类**字段
- 🚀 **产品前台实时更新**：后台新增的产品**无需重新部署**即出现在首页与产品列表页（客户端读取 `/api/products` 动态渲染），点击进入**独立详情页**（由 Cloudflare Pages Function 服务端渲染，含价格与购买按钮）；示例产品仍保留静态详情页（SEO）
- ⚡ **零闪现刷新**
- 💬 **留言管理**：前台「联系我们」表单提交的留言自动存入 D1，后台新增 **Messages** 页签以表格展示（姓名/邮箱/电话/公司/内容/时间）并支持删除
- 🔗 **页脚社交链接**：后台站点设置可填写 GitHub、Twitter / X 链接（未填写时页脚不显示）；已移除页脚的 Legal（Privacy/Terms/Security）死链
- 📐 **布局优化**：首页产品单行 4 个（窄屏自动降为 2 列 / 1 列）；已移除首页 SLA / 日处理事件 / 覆盖国家统计与「关于我们」右侧卡片、「企业级 · 云原生」徽标；页首 CTA 改为「联系我们」
- 🔝 **悬浮按钮**：右下角提供「回到顶部 / 到达底部」悬浮按钮
- 💬 **QQ / 微信**：站点设置新增联系 QQ 与微信，前台「直接联系我们」同步展示（中文显示 微信，英文显示 WeChat）
- 💬 **QQ / 微信**：站点设置新增联系 QQ 与微信，前台「直接联系我们」同步展示：站点设置与产品数据会在浏览器本地缓存，刷新页面时先用缓存即时渲染（不再闪现默认示例内容），再静默从 API 更新——内容变化依然实时生效
- 🗂️ **产品分类 + 搜索**：产品可设置分类（中英），前台产品板块自动生成**分类标签（二级筛选菜单）**与**搜索框**，按分类/关键词即时过滤
- 🏷️ **产品板块文案可设置**：后台「站点设置」可编辑产品板块的标题与副标题（双语），前台实时生效
- ⚙️ **站点设置后台**：`/admin` 的「站点设置」页分区块管理——**品牌**（网页标题、主页站点名称、Logo、Favicon）、**页首横幅**（大标题两行、副标题、主图）、**关于我们**、**联系方式**（邮箱、电话、地址），保存后前台**实时应用**，无需重新部署
- 🦶 **动态页脚**：页脚仅保留 LOGO 与「关于我们 / 联系我们」链接，社交链接（GitHub / X 图标）与版权文字均可后台配置；已移除模板中无效的 Careers / Press / Legal 等链接与语言切换下拉
- 🖼️ **产品图可选**：图片链接为空时自动使用内置默认图 `/images/products/placeholder.svg`
- 🔌 **前后端分离**：`functions/` 提供 REST API；前台页面构建时使用内置示例数据（SEO 友好），站点永不空白
- 🗄️ **D1 自动建表**：数据库绑定后首次请求自动创建 `products` / `settings` 表，**无需手动执行迁移**
- 🔑 **灵活的登录凭证**：支持明文密码（`ADMIN_PASSWORD`，推荐）或 SHA-256 哈希（`ADMIN_PASSWORD_HASH`），见「环境变量」
- 🌙 **暗黑模式**：前台与后台均支持一键切换，`localStorage` 记忆选择，跟随系统偏好作为默认值
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
3. 构建配置（**在 Dashboard 中填写**，仓库内**不要**提交 `wrangler.toml`——只要存在该文件，Cloudflare 就会把项目绑定切换为"由 wrangler.toml 管理"，导致 Dashboard 无法添加/删除 D1 绑定）：
   - 框架预设：**Astro**
   - 构建命令：`npm run build`
   - 输出目录：`dist`
4. 点击 **Save and Deploy**。部署成功后 Cloudflare 分配公网域名 `https://<project-name>.pages.dev`。
5. **部署完成后**，在项目 **Settings → Environment variables** 添加环境变量（见下表）。
6. 在项目 **Settings → Bindings → Add binding → D1 database** 添加数据库绑定（此时绑定界面可正常编辑）：
   - Variable name（变量名）：**任意**，如 `DB` 或 `qncms_db`（代码通过 `DB_BINDING_NAME` 环境变量读取实际绑定名，默认 `DB`）
   - D1 database：选择你已创建的数据库（如 `qncms`）
   - 若变量名不是 `DB`，在环境变量中添加 `DB_BINDING_NAME = <变量名>`
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
| `DB_BINDING_NAME` | 条件 | D1 绑定的**变量名**。默认 `DB`；若你在 Bindings 中把变量名取成了别的（如 `qncms_db`），这里填那个名字 |

> 凭证优先级：`ADMIN_PASSWORD`（明文）→ `ADMIN_PASSWORD_HASH`（64 位 hex 按哈希比对，否则按明文比对）。

生成 SHA-256 哈希（如改用哈希方式）：

```bash
node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"
```

---

## Admin 面板

- 访问：`https://<your-project>.pages.dev/admin/`
- 登录：`ADMIN_USERNAME` + 密码（`ADMIN_PASSWORD` 或对应 `ADMIN_PASSWORD_HASH` 的明文）
- 界面语言：右上角 **EN / 中文** 按钮一键切换后台界面语言，选择会记忆在浏览器中
- 功能：
  - **产品管理**：新增 / 编辑 / 删除产品（双语字段、分类、排序、图片 URL、**价格、购买链接**），支持**列表 / 缩略图 / 表格**三种视图切换（右上角 List / Grid / Table 按钮，选择会记忆）；顶部统一工具栏含**新增产品、搜索框、分类筛选、删除选中**，三种视图下均可用；**表格视图**下方固定显示**列设置面板**（勾选显示哪些列）、行内勾选可批量删除，图片在表格中固定缩小尺寸显示；图片链接**可留空**，留空自动使用默认图
  - **站点设置**：分区块编辑——品牌（标题/主页名称/Logo/Favicon）、**页首横幅**（大标题两行、副标题、主图，双语）、**产品板块**（标题/副标题，双语）、关于我们（双语）、联系方式（邮箱/电话/**地址**），保存后前台实时生效

> 提示：如果后台提示「Failed to load products」，多半是浏览器里残留了旧的登录凭据，刷新页面重新登录即可（登录凭据失效时会自动跳回登录页）。

### 前台产品展示说明

- 首页与产品列表页的产品网格**优先读取 `/api/products`**（后台写入 D1 的数据实时显示）；API 无数据时回退为构建时的示例产品。
- 产品网格上方自动生成**分类筛选标签**与**搜索框**：分类按当前产品数据的分类字段聚合去重；搜索按产品名称即时过滤（前后台均为客户端过滤，无需额外请求）。
- **所有产品卡片点击后均跳转到独立详情页** `/<locale>/products/<slug>/`（无弹层）。示例产品由静态构建生成；**后台新增的产品**由 Cloudflare Pages Function（`functions/[[path]].js` catch-all）在服务端实时查询 D1 并渲染完整详情页（200 状态、名称、简介、价格、购买按钮、概述、亮点），分享链接可直接访问、无缓存 / JS 依赖；若产品已删除则回退到 404 页。

### 产品字段

| 字段 | 必填 | 说明 |
|------|------|------|
| `slug` | ✓ | 唯一标识，用于产品页 URL，如 `nova-ingest` |
| `name_en` / `name_zh` | ✓ | 英文 / 中文名称 |
| `short_en` / `short_zh` | 兼容 | 简短描述（列表页显示）；后台新建/编辑表单不再提供该输入框，历史数据仍会显示 |
| `description_en` / `description_zh` | 可选 | 详细描述（详情页显示） |
| `highlights_en` / `highlights_zh` | 兼容 | JSON 数组，如 `["快速", "稳定"]`；后台表单不再提供该输入框，历史数据仍会显示 |
| `category_en` / `category_zh` | 可选 | 产品分类（英文/中文），前台自动聚合为分类筛选标签 |
| `image_url` | 可选 | 产品图片外链地址；留空自动使用默认图 `/images/products/placeholder.svg` |
| `price` | 可选 | 价格展示文本（如 `$29/mo`），显示在产品卡片与详情页 |
| `buy_url` | 可选 | 购买/了解更多外链；填写后产品详情显示「Buy now / 立即购买」按钮 |
| `position` | 可选 | 排序权重，越小越靠前 |
| `active` | ✓ | 发布状态：`1`=已发布（前台可见），`0`=草稿（仅在后台「草稿箱」筛选视图可见） |

> 后台产品表单按 **中文内容 / English Content / 共用参数 Shared** 三组展示：中英分离字段（名称/标签/分类/描述）用不同语言文字直接标注，共用字段（Slug/图片/价格/购买链接/排序/状态）以括号双语标注。点击编辑弹窗背景不会关闭弹窗，只有「保存 / 取消」会退出。

### 站点设置字段

| 区块 | 字段 | 说明 |
|------|------|------|
| 品牌 | `site_title_en` / `site_title_zh` | 浏览器标签标题 + 主页/页脚站点名称 |
| 品牌 | `logo_url` | Logo 图片 URL，填写后替换文字 Logo |
| 品牌 | `favicon_url` | 浏览器标签图标 URL |
| 页首横幅 | `hero_title1_en/zh`、`hero_title2_en/zh` | 首页大标题两行 |
| 页首横幅 | `hero_subtitle_en/zh` | 首页副标题 |
| 页首横幅 | `hero_image_url` | 首页大图（建议 900×675） |
| 产品板块 | `products_title_en/zh` | 产品板块大标题（默认“为数据驱动型企业打造的一体化技术栈…”） |
| 产品板块 | `products_subtitle_en/zh` | 产品板块副标题 |
| 关于我们 | `about_title_en/zh`、`about_body_en/zh` | 首页「关于我们」区块标题与内容 |
| 联系方式 | `contact_email` / `contact_phone` / `contact_address` | 联系区块展示的邮箱、电话、地址 |

> 任何字段留空即保持当前默认内容；保存后前台无需重新部署即生效。

### 页脚说明

页脚仅保留站点 LOGO 与「关于我们 / 联系我们」两列；GitHub / Twitter（X）以图标展示（后台填写链接后显示，未填自动隐藏）；版权文字可在后台「页脚」设置区自定义（未填时自动使用 品牌 + 年份）；语言切换统一在右上角下拉完成。

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
│       │   ├── delete.js       # DELETE /api/products/delete?slug=（需认证）
│       │   └── batch-delete.js # POST /api/products/batch-delete（需认证，批量删除）
│       ├── admin/
│       │   └── products.js     # GET /api/admin/products 双语完整数据（需认证）
│       ├── settings.js         # GET /api/settings 站点设置（公开，前台读取）
│       │                       # POST /api/settings 保存设置（需认证）
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
│   ├── scripts/site.js         # 客户端脚本（主题切换/设置应用/产品动态渲染/详情弹层）
│   ├── favicon.svg
│   ├── robots.txt
│   └── _redirects              # Pages 重定向（/admin → /admin/、动态产品直链回退）
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

> 页首的**地球图标语言菜单**（前台与后台一致）会自动遍历 `locales` 渲染新选项：显示语言缩写徽标（EN / 中，其他语言自动用大写代码如 RU）+ 语言名，无需改组件。如需自定义某语言的缩写或显示名，改 `Header.astro` 的缩写映射或 `localeNames` 即可。

### 模板（布局 × 配色）开发规范

后台顶部菜单「模板（Templates）」页签分**布局（Layout）**与**配色（Color Scheme）**两组，两者相互独立、可任意组合：

- **布局模板**：改变页面结构与观感（导航、Hero 排版、卡片风格、页脚等），通过 `<html data-layout="...">` 上的 CSS 覆盖实现，**不改变 HTML 结构、不改配色变量**。
- **配色模板**：本质是一组品牌色 CSS 变量（只改颜色、不改布局），与暗黑模式正交（模板 × 浅/深色可任意组合）。

前台由 `site.js` 在运行时读取设置写入 `data-layout` / `data-variant` 属性；后台管理界面自身会跟随配色以便预览。

**现有布局模板**：

| 布局（value） | 显示名 | 说明 |
|---|---|---|
| `classic` | 官方布局 | 默认布局（无 `data-layout` 属性） |
| `modern` | 新布局 | 居中 Hero + 渐变氛围、导航选中下划线、悬浮式产品卡片、页脚浅色底 |

**现有配色模板**：

| 模板名（value） | 显示名（中文） | 主色 | 次色 | 渐变 |
|---|---|---|---|---|
| `default` | 官方模板-蓝紫色 | #2563eb | #7c3aed | 蓝 → 紫 |
| `ocean` | 官方模板-青色 | #0e7490 | #2563eb | 青 → 蓝 |
| `forest` | 官方模板-绿色 | #059669 | #0d9488 | 绿 → 青 |
| `sunset` | 官方模板-橙色 | #ea580c | #db2777 | 橙 → 粉 |

**新增一个布局模板（三步）**：

1. **定义覆盖样式**：在 `src/styles/global.css` 末尾追加以 `html[data-layout="my-layout"]` 开头的规则（如居中排版、卡片风格、页脚样式等）。**规范要求**：布局模板只允许调整布局/视觉结构（对齐、间距、圆角、卡片、分区、背景氛围），**不得覆盖品牌色变量**（`--brand` 等由配色模板管理），也不得改 HTML 结构；优先复用现有类名（`.hero-grid`、`.product-card`、`.section-head`、`.site-footer` 等），保证与配色 × 明暗模式任意组合都正常。
2. **注册到后台**：在 `src/pages/admin/index.astro` 的 `LAYOUTS` 数组中加一条记录 `{ id: 'my-layout', nameKey: 'layoutMy' }`，并在 EN / ZH 字典各加显示名。
3. **生效方式**：后台「模板」页点击应用后保存 `layout_name`，`site.js` 将 `<html data-layout="my-layout">` 写入根元素，前台自动切换，无需重新部署。动态产品详情页（`functions/[[path]].js`）也会读取 `layout_name` 并应用同套覆盖。

**新增一个配色模板（三步）**：

1. **定义配色**：在 `src/styles/global.css` 末尾追加一条规则：
   ```css
   html[data-variant="rose"] {
     --brand: #e11d48;
     --brand-2: #d946ef;
     --brand-grad: linear-gradient(135deg, #f43f5e 0%, #d946ef 100%);
     --accent: #fb7185;
   }
   ```
2. **注册到后台**：在 `src/pages/admin/index.astro` 的 `TEMPLATES` 数组中加一条记录 `{ id: 'rose', grad: 'linear-gradient(135deg,#f43f5e 0%,#d946ef 100%)', nameKey: 'tplRose' }`（`grad` 为卡片预览渐变），并在 EN / ZH 字典各加显示名（`tplRose: 'Official Template - Rose (Pink-Red)'` / `tplRose: '官方模板-玫红色'`）。
3. **生效方式**：后台「模板」页点击应用后，`site.js` 将 `<html data-variant="rose">` 写入根元素，前台 CSS 变量自动切换，无需重新部署。**后台管理界面自身也会跟随模板配色**（admin 样式内置了同一套 `html[data-variant]` 品牌色覆盖规则），方便预览整体效果。

**可覆盖的变量清单**：

| 变量 | 用途 |
|---|---|
| `--brand` | 主品牌色（按钮、链接、图标、价格等） |
| `--brand-2` | 次级品牌色（渐变末端） |
| `--brand-grad` | 品牌渐变（按钮背景、图标块等） |
| `--accent` | 强调色（hover 高亮等） |

> **规范要求**：模板只允许覆盖上述**品牌色变量**；布局、字号、间距与明暗主题变量（`--bg`、`--ink`、`--line` 等）不得在模板中改动，以保证任意模板 × 任意明暗模式的组合都正常。若需要新的设计变量，先在 `:root` 统一声明后再于模板中覆盖。

**页面级模板（规划预留）**：目前模板仅作用于配色。后续计划为前台页面提供**后台可视化的页面级模板**（区块组合），当前已预留扩展点：设置表为通用 key/value、页面组件可自由拼装、`site.js` 已实现运行时数据渲染、后台表单为通用结构——届时只需新增 `pages` 表（slug、template_id、locale 字段 JSON）+ 后台「页面」页签 + 前台动态渲染入口，无需重构。---

## API 一览

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth` | 否 | 登录，返回 token（body: `{username, password}`） |
| GET | `/api/me` | Bearer token | 当前会话状态 |
| GET | `/api/products?locale=en&slug=` | 否 | 产品列表 / 单个产品（公开） |
| POST | `/api/products` | Bearer token | 新增或更新产品 |
| POST | `/api/products/create` | Bearer token | 新增产品（别名） |
| DELETE | `/api/products/delete?slug=x` | Bearer token | 删除单个产品 |
| POST | `/api/products/batch-delete` | Bearer token | 批量删除（body: `{slugs: [...]}`） |
| GET | `/api/admin/products` | Bearer token | 双语完整字段（后台编辑用） |
| GET/POST | `/api/settings` | GET 公开 / POST 需认证 | 站点设置读取（前台用）/ 保存（后台用） |
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

D1 绑定未生效。到项目 **Settings → Bindings** 确认已绑定真实数据库；若绑定变量名不是 `DB`，需在环境变量中设置 `DB_BINDING_NAME = <变量名>`；确认后重新部署。

### Q: Dashboard 提示「绑定由 wrangler.toml 管理」，无法添加/删除绑定？

仓库中存在 `wrangler.toml` 会导致 Cloudflare 接管绑定管理。删除仓库中的 `wrangler.toml` 并重新部署即可恢复 Dashboard 手动管理（模板已移除该文件；构建配置在 Dashboard 中填写：`npm run build` / `dist`）。

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
