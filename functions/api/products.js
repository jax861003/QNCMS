// /api/products - GET: public product list (D1 or inline fallback)
// POST: create/update product (auth required, writes to D1)
import { requireAuth } from '../_utils.js';

export async function GET(context) {
  const locale = context.url.searchParams.get('locale') || 'en';
  const slug = context.url.searchParams.get('slug');
  const env = context.locals.runtime.env;
  const db = env.DB;

  // Try D1 first (production), fallback to inline data
  if (db && typeof db.prepare === 'function') {
    try {
      if (!slug) {
        const result = await db
          .prepare('SELECT * FROM products WHERE active = 1 ORDER BY position ASC')
          .all();
        return context.json(rowsToProducts(result.results || [], locale));
      }
      const result = await db
        .prepare('SELECT * FROM products WHERE slug = ? AND active = 1')
        .bind(slug)
        .first();
      if (!result) {
        return context.json({ error: 'Product not found' }, { status: 404 });
      }
      return context.json(rowToProduct(result, locale));
    } catch (e) {
      console.log('D1 query failed, using inline fallback:', e);
    }
  }

  // Inline fallback data (local dev / D1 not bound / table empty)
  const products = INLINE_PRODUCTS.map((p) => localize(p, locale));
  if (slug) {
    const product = products.find((p) => p.slug === slug);
    return context.json(product || { error: 'Product not found' }, {
      status: product ? 200 : 404,
    });
  }
  return context.json(products);
}

export async function POST(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return context.json(auth.body, { status: auth.status });

  const body = await context.request.json().catch(() => null);
  if (!body || !body.slug) {
    return context.json({ ok: false, message: 'Missing slug' }, { status: 400 });
  }

  const db = context.locals.runtime.env.DB;
  if (!db || typeof db.prepare !== 'function') {
    return context.json({ ok: false, message: 'Database not available' }, { status: 503 });
  }

  const fields = {
    tag_en: body.tag_en || '',
    tag_zh: body.tag_zh || '',
    name_en: body.name_en || '',
    name_zh: body.name_zh || '',
    short_en: body.short_en || '',
    short_zh: body.short_zh || '',
    description_en: body.description_en || '',
    description_zh: body.description_zh || '',
    highlights_en: JSON.stringify(Array.isArray(body.highlights_en) ? body.highlights_en : []),
    highlights_zh: JSON.stringify(Array.isArray(body.highlights_zh) ? body.highlights_zh : []),
    image_url: body.image_url || '',
    position: Number(body.position) || 0,
  };

  const existing = await db
    .prepare('SELECT id FROM products WHERE slug = ?')
    .bind(body.slug)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE products SET tag_en=?, tag_zh=?, name_en=?, name_zh=?, short_en=?, short_zh=?,
         description_en=?, description_zh=?, highlights_en=?, highlights_zh=?,
         image_url=?, position=?, updated_at=datetime('now')
         WHERE slug=?`
      )
      .bind(
        fields.tag_en, fields.tag_zh, fields.name_en, fields.name_zh,
        fields.short_en, fields.short_zh, fields.description_en, fields.description_zh,
        fields.highlights_en, fields.highlights_zh, fields.image_url, fields.position,
        body.slug
      )
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO products (id, slug, tag_en, tag_zh, name_en, name_zh, short_en, short_zh,
         description_en, description_zh, highlights_en, highlights_zh, image_url, position,
         active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
      )
      .bind(
        'prod-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        body.slug,
        fields.tag_en, fields.tag_zh, fields.name_en, fields.name_zh,
        fields.short_en, fields.short_zh, fields.description_en, fields.description_zh,
        fields.highlights_en, fields.highlights_zh, fields.image_url, fields.position
      )
      .run();
  }

  return context.json({ ok: true, slug: body.slug });
}

function rowToProduct(p, locale) {
  return {
    id: p.id,
    slug: p.slug,
    tag: locale === 'zh' ? p.tag_zh : p.tag_en,
    name: locale === 'zh' ? p.name_zh : p.name_en,
    short: locale === 'zh' ? p.short_zh : p.short_en,
    description: locale === 'zh' ? p.description_zh : p.description_en,
    highlights: safeParseArray(locale === 'zh' ? p.highlights_zh : p.highlights_en),
    image_url: p.image_url,
    position: p.position,
  };
}

function rowsToProducts(rows, locale) {
  return rows.map((p) => rowToProduct(p, locale));
}

function localize(p, locale) {
  return {
    id: p.id,
    slug: p.slug,
    tag: locale === 'zh' ? p.tag_zh : p.tag_en,
    name: locale === 'zh' ? p.name_zh : p.name_en,
    short: locale === 'zh' ? p.short_zh : p.short_en,
    description: locale === 'zh' ? p.description_zh : p.description_en,
    highlights: safeParseArray(locale === 'zh' ? p.highlights_zh : p.highlights_en),
    image_url: p.image_url,
    position: p.position,
  };
}

function safeParseArray(json) {
  try {
    const v = JSON.parse(json || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Inline fallback products (kept in sync with src/data/products.json)
const INLINE_PRODUCTS = [
  {
    id: 'nova-ingest', slug: 'nova-ingest',
    tag_en: 'Streaming', tag_zh: '数据接入',
    name_en: 'Ingest', name_zh: 'Nova Ingest',
    short_en: 'Real-time ingestion for structured and unstructured data with exactly-once semantics.',
    short_zh: '为结构化与非结构化数据提供实时接入，支持精确一次（exactly-once）语义。',
    description_en: 'Collect data from any source — databases, message queues, APIs, files — with automatic schema inference and transformation.',
    description_zh: '从任何数据源采集数据——数据库、消息队列、API、文件——支持自动模式推断和转换。',
    highlights_en: '["Exactly-once delivery", "Auto-schema inference", "Real-time streaming"]',
    highlights_zh: '["精确一次投递", "自动模式推断", "实时流处理"]',
    image_url: '/images/products/ingest.png', position: 1,
  },
  {
    id: 'nova-orchestrate', slug: 'nova-orchestrate',
    tag_en: 'Workflows', tag_zh: '任务编排',
    name_en: 'Orchestrate', name_zh: 'Nova Orchestrate',
    short_en: 'Visual DAG orchestration for complex, multi-step data pipelines.',
    short_zh: '面向复杂多步骤数据管道的可视化 DAG 编排。',
    description_en: 'Build, monitor, and scale complex data workflows with a visual editor and powerful retry/scheduling capabilities.',
    description_zh: '使用可视化编辑器和强大的重试/调度功能，构建、监控和扩展复杂数据工作流。',
    highlights_en: '["Visual DAG editor", "Smart retries", "Scale to millions"]',
    highlights_zh: '["可视化 DAG 编辑器", "智能重试机制", "百万级扩展"]',
    image_url: '/images/products/orchestrate.png', position: 2,
  },
  {
    id: 'nova-analytics', slug: 'nova-analytics',
    tag_en: 'BI & SQL', tag_zh: '分析与 SQL',
    name_en: 'Analytics', name_zh: 'Nova Analytics',
    short_en: 'A blazing-fast query engine over petabyte-scale data, with a no-code BI surface.',
    short_zh: '面向 PB 级数据的极速查询引擎，附带无代码 BI 界面。',
    description_en: 'Run SQL queries across terabytes of data in seconds. Includes dashboards, scheduled reports, and shareable insights.',
    description_zh: '在数秒内跨TB级数据运行 SQL 查询。包含仪表板、定时报告和可分享洞察。',
    highlights_en: '["Sub-second queries", "No-code BI", "Shareable dashboards"]',
    highlights_zh: '["亚秒级查询", "无代码 BI", "可分享仪表板"]',
    image_url: '/images/products/analytics.png', position: 3,
  },
  {
    id: 'nova-observability', slug: 'nova-observability',
    tag_en: 'Monitoring', tag_zh: '可观测性',
    name_en: 'Observe', name_zh: 'Nova Observe',
    short_en: 'Unified metrics, logs, and traces with adaptive, cost-aware sampling.',
    short_zh: '统一的指标、日志与链路追踪，支持自适应、成本感知采样。',
    description_en: 'Gain full visibility into your infrastructure with correlated metrics, logs, and distributed traces — all in one pane.',
    description_zh: '通过关联指标、日志和分布式追踪，全面了解您的基础设施——全部在一个面板中。',
    highlights_en: '["Correlated signals", "Adaptive sampling", "Cost-aware retention"]',
    highlights_zh: '["关联信号分析", "自适应采样", "成本感知留存"]',
    image_url: '/images/products/observe.png', position: 4,
  },
];
