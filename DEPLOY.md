# NovaGrid - 前后端分离企业官网
# Cloudflare D1 + Pages Functions + Pages 静态前端

## 部署步骤

### 1. 创建 D1 数据库
```bash
npx wrangler d1 create nova-site-db
# 记录 DATABASE_ID，填入 wrangler.toml
npx wrangler d1 execute nova-site-db --remote --file=wrangler.migrations/001_init.sql
```

### 2. 生成密码哈希（替换 ADMIN_PASSWORD_HASH）
```bash
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode(process.argv[1])).then(h => console.log(Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('')))" "your_password"
```

### 3. 本地开发
```bash
npx wrangler pages dev dist --d1=DB --binding=ADMIN_USERNAME=admin --binding=ADMIN_PASSWORD_HASH=<hash> --binding=JWT_SECRET=dev-secret
```

### 4. 部署到 Cloudflare Pages
- 连接 GitHub 仓库
- Build command: `npm run build`
- Output directory: `dist`
- Build hooks: `POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/webhooks/deploy_hook`