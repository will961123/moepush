# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

MoePush 是一个基于 Next.js + Cloudflare 技术栈构建的消息推送服务,支持多种推送渠道(钉钉、企业微信、Telegram、飞书、Discord、Bark、通用 Webhook)。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **部署平台**: Cloudflare Pages
- **数据库**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **认证**: NextAuth 5.0 (支持 GitHub OAuth 和用户名/密码登录)
- **UI**: Tailwind CSS + shadcn/ui (基于 Radix UI)
- **包管理器**: pnpm

## 常用命令

### 开发
```bash
# 启动开发服务器 (使用 Turbopack)
pnpm dev

# 代码检查
pnpm lint
```

### 数据库
```bash
# 生成数据库迁移文件并应用到本地 D1 数据库
pnpm db:migrate-local

# 注意: 这个命令会执行两个操作:
# 1. drizzle-kit generate - 根据 schema 生成迁移 SQL
# 2. wrangler d1 migrations apply moepush --local - 应用迁移到本地数据库
```

### 构建和部署
```bash
# 构建标准 Next.js 应用
pnpm build

# 构建 Cloudflare Pages 版本
pnpm pages:build

# 本地预览 Cloudflare Pages 版本
pnpm preview

# 部署到 Cloudflare Pages
pnpm deploy

# 创建本地隧道 (用于测试 webhook)
pnpm tunnel
```

## 核心架构

### 数据模型

项目使用四个主要的数据表:

1. **users/accounts** (`lib/db/schema/auth.ts`): 用户认证相关
2. **channels** (`lib/db/schema/channels.ts`): 推送渠道配置 (webhook、secret、token 等)
3. **endpoints** (`lib/db/schema/endpoints.ts`): 推送端点,关联一个 channel 和一个消息模板规则
4. **endpoint_groups** (`lib/db/schema/endpoint-groups.ts`): 端点组,包含多个 endpoints

### Channel 系统设计

Channel 系统是项目的核心,采用面向对象的设计模式:

- **抽象基类**: `lib/channels/base.ts` 定义了 `BaseChannel` 抽象类
- **具体实现**: 每个推送渠道 (dingtalk, wecom, telegram 等) 都继承 `BaseChannel` 并实现 `sendMessage` 方法
- **注册机制**: `lib/channels/index.ts` 中注册所有渠道实例,提供统一的 `getChannel()` 和 `sendChannelMessage()` 接口
- **模板系统**: 每个 channel 定义自己的消息模板 (templates),包含字段定义和验证规则

添加新渠道时:
1. 在 `lib/channels/` 创建新的渠道类,继承 `BaseChannel`
2. 实现 `config` 属性和 `sendMessage` 方法
3. 在 `lib/channels/index.ts` 中注册新渠道
4. 在 `CHANNEL_TYPES` 中添加新的渠道类型常量

### API 路由结构

项目使用 Next.js App Router,API 路由位于 `app/api/`:

- **认证**: `/api/auth/[...nextauth]` - NextAuth 处理器
- **注册**: `/api/register` - 用户注册 (可通过 `DISABLE_REGISTER` 环境变量禁用)
- **渠道管理**: `/api/channels` 和 `/api/channels/[channelId]`
- **端点管理**: `/api/endpoints` 和 `/api/endpoints/[endpointId]`
- **端点组管理**: `/api/endpoint-groups` 和 `/api/endpoint-groups/[id]`
- **消息推送**:
  - `/api/push/[id]` - 推送到单个端点
  - `/api/push-group/[id]` - 推送到端点组

### 认证和授权

- **认证提供者**:
  - GitHub OAuth (生产环境推荐)
  - Credentials Provider (用户名/密码)
- **Session 策略**: JWT (不使用数据库 session)
- **中间件保护** (`middleware.ts`):
  - `/moe/*` 页面需要登录
  - `/api/channels`, `/api/endpoints`, `/api/endpoint-groups` 需要认证
  - `/api/push/*` 和 `/api/push-group/*` 不需要认证 (用于外部调用)

### Cloudflare 特性

项目使用 `@cloudflare/next-on-pages` 适配 Cloudflare Pages:

- **开发环境**: `next.config.ts` 中调用 `setupDevPlatform()` 模拟 Cloudflare 环境
- **数据库**: 使用 Cloudflare D1 (SQLite),通过 `getDb()` 获取数据库实例
- **环境变量**: 在 Cloudflare Pages 中配置,本地开发使用 `.env` 文件
- **构建**: 使用 `@cloudflare/next-on-pages` 将 Next.js 应用转换为 Cloudflare Workers

### 环境变量

必需的环境变量 (参考 `.env.example`):

- `AUTH_SECRET`: NextAuth session 加密密钥
- `AUTH_GITHUB_ID`: GitHub OAuth App ID
- `AUTH_GITHUB_SECRET`: GitHub OAuth App Secret
- `DISABLE_CREDENTIALS_REGISTER`: 是否禁用账号密码注册 (可选,默认 false)
- `DISABLE_GITHUB_REGISTER`: 是否禁用 GitHub 注册 (可选,默认 false)

注册控制说明:
- `DISABLE_CREDENTIALS_REGISTER=true` 禁用账号密码注册
- `DISABLE_GITHUB_REGISTER=true` 禁用 GitHub 新用户注册（已有用户仍可登录）

### 开发工作流

1. **首次设置**:
   ```bash
   pnpm install
   cp .env.example .env
   cp wrangler.example.json wrangler.json
   pnpm db:migrate-local
   ```

2. **添加新的推送渠道**:
   - 在 `lib/channels/` 创建新渠道类
   - 继承 `BaseChannel` 并实现 `sendMessage` 方法
   - 在 `lib/channels/index.ts` 注册
   - 更新 `CHANNEL_TYPES` 常量

3. **数据库 Schema 变更**:
   - 修改 `lib/db/schema/` 中的 schema 文件
   - 运行 `pnpm db:migrate-local` 生成并应用迁移

4. **测试 Webhook**:
   - 使用 `pnpm tunnel` 创建公网隧道
   - 或使用 `pnpm preview` 本地预览 Cloudflare Pages 版本

### 项目特点

- **多租户**: 每个用户有独立的 channels、endpoints 和 endpoint-groups
- **消息模板**: 使用 `rule` 字段存储 JSON 格式的消息模板配置
- **端点组**: 支持一次推送到多个端点,提高效率
- **状态管理**: endpoints 和 endpoint-groups 支持 active/inactive 状态切换

