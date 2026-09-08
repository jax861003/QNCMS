# QNCMS — 企业官网内容管理系统

基于 Astro + Cloudflare Pages + D1 的企业官网 CMS，支持多语言、产品后台管理、前后端分离架构。

**技术栈**: Astro 4.x · Cloudflare Pages Functions · D1 (SQLite) · JWT 认证

---

## 特性

- 🌐 **多语言**：内置 `en` / `zh`，URL 路由前缀 `/en/...` `/zh/...`，右上角一键切换
- 🛒 **产品管理后台**：`/admin` 路径，登录后增删改产品（实时生效，无需重新部署）
- 🔌 **前后端分离**：前端静态渲染 + API 接口，D1 数据库持久化
- 🖼️ **外链图片**：产品图片使用 URL，无需对象存储，零额外费用
- ⚡ **Cloudflare CDN**：全球边缘节点，自动 HTTPS，秒级部署
- 📱 **响应式**：全设备适配，移动端汉堡菜单
- 🎨 **简洁大气 UI**：自定义 CSS 变量设计系统，蓝紫渐变色系

---

## 快速开始

### 1. 克隆模板仓库

```bash
git clone https://github.com/jax861003/QNCMS.git
cd QNCMS
npm install
```

### 2. 配置环境变量

复制并编辑 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "nova-site-db"
database_id = "YOUR_D1_DATABASE_ID"  # ← 必须替换

[vars]
ADMIN_USERNAME = "admin"              # ← 改为你的管理员用户名
# 生成密码哈希：node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"
ADMIN_PASSWORD_HASH = "生成的SHA256哈希值"  # ← 必须替换
JWT_SECRET = "CHANGE-ME-TO-RANDOM-32-CHARS"  # ← 必须替换为随机字符串
```

### 3. 创建 D1 数据库

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create nova-site-db

# 复制返回的 DATABASE_ID，填入上面的 wrangler.toml

# 执行迁移脚本
npx wrangler d1 execute nova-site-db --remote --file=wrangler.migrations/001_init.sql
```

### 4. 本地开发

```bash
# 启动开发服务器（含 Functions + D1）
npx wrangler pages dev dist --d1=nova-site-db --local

# 或直接启动
npm run dev
```

访问：
- 首页：http://localhost:8788/en/
- Admin 面板：http://localhost:8788/admin/

### 5. 部署到 Cloudflare Pages

#### 方法 A：GitHub 自动部署（推荐）

1. 将代码推送到 GitHub
   ```bash
   git init
   git remote add origin https://github.com/your-username/QNCMS.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. Cloudflare Dashboard → Pages → Create a project → Connect to Git
3. 选择仓库，配置：
   - Build command: `npm run build`
   - Output directory: `dist`
4. 添加环境变量：
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `JWT_SECRET`
5. Save and Deploy

#### 方法 B：手动上传

```bash
# 构建
npm run build

# 上传到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=your-project-name
```

---

## 文件结构

```
QNCMS/
├── functions/                    # Cloudflare Pages Functions（后端 API）
│   ├── api/
│   │   ├── auth.ts              # 登录接口（POST）
│   │   ├── me.ts                # 当前用户信息（GET）
│   │   ├── products.ts          # 产品列表（GET）+ 创建/更新（POST）
│   │   ├── products/
│   │   │   ├── delete.ts        # 删除产品（DELETE）
│   │   │   └── by-slug.ts       # 单个产品详情（GET）
│   │   ├── settings.ts          # 站点设置（GET/POST，需认证）
│   │   └── contact.ts           # 联系表单（POST）
│   └── _utils.ts                # 认证工具函数
├── src/
│   ├── i18n/
│   │   ├── en.json              # 英文文案
│   │   └── zh.json              # 中文文案
│   ├── data/
│   │   └── products.json        # 产品数据（开发环境回退）
│   ├── layouts/
│   │   └── BaseLayout.astro     # 全局布局
│   ├── components/
│   │   ├── Header.astro         # 导航栏
│   │   ├── Footer.astro         # 页脚
│   │   ├── Hero.astro           # 首页横幅
│   │   ├── ProductGrid.astro    # 产品网格
│   │   ├── ProductsSection.astro # 产品区块
│   │   ├── AboutSection.astro    # 关于区块
│   │   └── ContactSection.astro  # 联系区块
│   ├── lib/
│   │   ├── i18n.ts             # 国际化工具
│   │   ├── products.ts         # 产品数据读取
│   │   └── api.ts              # API 调用封装
│   └── pages/
│       ├── index.astro          # 根路由（语言重定向）
│       ├── 404.astro            # 404 页面
│       ├── admin/
│       │   └── index.astro      # 管理面板
│       ├── en/                  # 英文页面
│       │   ├── index.astro
│       │   ├── products/
│       │   │   ├── index.astro
│       │   │   └── [slug].astro
│       │   ├── about.astro
│       │   └── contact.astro
│       └── zh/                  # 中文页面（同上结构）
├── public/
│   ├── images/                  # 静态资源
│   ├── scripts/
│   │   └── site.js             # 客户端脚本
│   └── favicon.svg
├── wrangler.toml               # Wrangler 配置
├── wrangler.migrations/
│   └── 001_init.sql            # D1 迁移脚本
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── README.md
└── DEPLOY.md                   # 详细部署指南
```

---

## 环境变量说明

### 必需变量（生产环境必须配置）

| 变量名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `ADMIN_USERNAME` | string | ✓ | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD_HASH` | string | ✓ | 密码 SHA-256 哈希 | `5e884898...` |
| `JWT_SECRET` | string | ✓ | JWT 签名密钥 | `my-secret-key-32-chars-minimum` |
| `database_id` | string | ✓ | D1 数据库 ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

### 可选变量

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `SITE_URL` | string | 无 | 站点 URL，影响 canonical 链接 |
| `CONTACT_EMAIL` | string | 无 | 联系表单接收邮箱 |

### 如何生成密码哈希

```bash
# Node.js
node -e "console.log(require('crypto').createHash('sha256').update('your_password').digest('hex'))"

# OpenSSL
echo -n "your_password" | openssl dgst -sha256

# Python
python3 -c "import hashlib; print(hashlib.sha256(b'your_password').hexdigest())"
```

---

## Admin 面板使用

### 访问地址

- 生产环境：`https://your-domain.com/admin/`
- 本地开发：`http://localhost:8788/admin/`

### 功能清单

| 功能 | 操作方式 |
|------|----------|
| 登录 | 输入 `ADMIN_USERNAME` 和密码 |
| 新增产品 | 点击 "+ Add Product" 按钮 |
| 编辑产品 | 点击产品卡片的 "Edit" 按钮 |
| 删除产品 | 点击 "Delete" 按钮确认 |
| 修改后保存 | 自动同步到 D1 数据库 |

### 产品字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `slug` | ✓ | 产品唯一标识，用于 URL，如 `nova-ingest` |
| `name_en` / `name_zh` | ✓ | 产品英文/中文名称 |
| `short_en` / `short_zh` | ✓ | 简短描述（产品列表页显示） |
| `description_en` / `description_zh` | 可选 | 详细描述（产品详情页显示） |
| `highlights_en` / `highlights_zh` | 可选 | JSON 数组，产品亮点，如 `["快速", "稳定", "安全"]` |
| `image_url` | ✓ | 产品图片外链地址（建议尺寸 800×600px） |
| `position` | 可选 | 排序权重，数字越小越靠前 |

---

## 定制说明

### 修改品牌信息

编辑 `src/i18n/{en,zh}.json`：
```json
{
  "brand": "你的品牌名",
  "hero": {
    "title": "主标题",
    "subtitle": "副标题"
  }
}
```

### 修改配色方案

编辑 `src/styles/global.css` 顶部的 CSS 变量：
```css
:root {
  --brand: #2563eb;      /* 主色 */
  --brand-2: #7c3aed;    /* 辅助色 */
  --accent: #06b6d4;     /* 强调色 */
}
```

### 替换主视觉图片

- 位置：`public/images/hero-dashboard.png`
- 建议尺寸：1920×1080px 或更高

### 添加新语言

1. 复制 `src/i18n/en.json` 为 `src/i18n/ja.json`，翻译所有键值
2. 在 `src/lib/i18n.ts` 的 `locales` 数组中添加 `'ja'`
3. 在 `astro.config.mjs` 的 `locales` 数组中添加 `'ja'`
4. 复制 `src/pages/en/` 目录为 `src/pages/ja/`，将所有 `locale = 'en'` 改为 `'ja'`

---

## 常见问题

### Q: D1 数据库免费额度是多少？

- 每日 50,000 次读取 + 1,000 次写入
- 存储 5GB
- 对于企业官网完全够用

### Q: 如何更换产品图片？

通过 Admin 面板编辑产品的 `image_url` 字段，填入新的外链地址即可。图片可托管在：
- Cloudflare R2（需要绑定信用卡）
- AWS S3 / Google Cloud Storage
- 阿里云 OSS / 腾讯云 COS
- 任何公开的 CDN 地址

### Q: 修改产品后需要重新部署吗？

不需要！通过 Admin 面板修改后，D1 数据库立即更新，API 接口实时生效。

### Q: 没有域名可以部署吗？

可以！Cloudflare Pages 会免费提供 `*.pages.dev` 子域名。

### Q: 如何禁用 Admin 面板？

从 `src/pages/admin/` 目录删除 `index.astro` 文件，或添加路由守卫限制访问。

---

## 许可证

MIT License

---

## 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Astro 文档](https://docs.astro.build/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
