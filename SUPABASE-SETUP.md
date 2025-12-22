# Supabase 数据库配置指南

## 🎯 第二步：配置 Supabase Serverless 数据库

根据老师要求，我们使用 **Supabase** 作为 Serverless 数据库集群，同时 Supabase 自带的管理界面可以替代 Navicat。

### 2.1 注册并创建 Supabase 项目

1. **访问 Supabase 官网**

   - 打开 https://supabase.com
   - 点击 **"Start your project"** 或 **"Sign up"**

2. **使用 GitHub 账号登录**

   - 点击 **"Continue with GitHub"**
   - 授权 Supabase 访问你的 GitHub 账号

3. **创建新组织（如果是首次使用）**

   ```yaml
   Organization name: 你的名字或项目名
   ```

4. **创建新项目**
   - 点击 **"New project"**
   - 配置如下：

```yaml
Project name: koa-mpa-db
Database Password: 创建一个强密码（至少 12 个字符）
Region: Northeast Asia (Tokyo) - ap-northeast-1
Pricing Plan: Free (免费套餐)
```

5. **等待项目创建**
   - ⏱️ 约 2-3 分钟
   - 状态变为 "Active" 后即可使用

### 2.2 获取数据库连接信息

1. **进入项目设置**

   - 在项目页面，点击左侧边栏的 **齿轮图标 (Settings)**
   - 选择 **"Database"**

2. **记录连接信息**

   在 **"Connection info"** 部分，找到以下信息：

```yaml
Host: db.xxxxxxxxxxxxx.supabase.co
Database name: postgres
Port: 5432
User: postgres
Password: 你创建项目时设置的密码
```

3. **获取 Connection String**

   在 **"Connection string"** 部分，选择 **"URI"** 标签页：

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

⚠️ **重要**：记得将 `[YOUR-PASSWORD]` 替换为实际密码！

### 2.3 配置 Prisma 连接 Supabase

1. **创建或更新 `.env` 文件**

在项目根目录创建 `.env` 文件：

```bash
# Supabase Database Configuration
DATABASE_URL="postgresql://postgres:你的密码@db.xxxxxxxxxxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Direct connection (用于 Prisma Migrate)
DIRECT_URL="postgresql://postgres:你的密码@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# Application settings
NODE_ENV=development
PORT=8082
LOG_LEVEL=info
```

2. **更新 `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// 你的数据模型
model User {
  id        String   @id @default(cuid())
  githubId  String   @unique
  username  String
  avatarUrl String?
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model FormData {
  id        String   @id @default(cuid())
  field1    String
  field2    String
  userId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("form_data")
}
```

3. **安装依赖**

```bash
# 安装 Prisma
yarn add prisma @prisma/client

# 安装 PostgreSQL 客户端（Supabase 使用 PostgreSQL）
yarn add pg
```

4. **运行数据库迁移**

```bash
# 生成 Prisma Client
npx prisma generate

# 创建并应用迁移
npx prisma migrate dev --name init

# 查看数据库（在浏览器中打开 Prisma Studio）
npx prisma studio
```

### 2.4 使用 Supabase Dashboard 管理数据库

Supabase 提供了强大的 Web 管理界面，替代 Navicat：

1. **Table Editor（表编辑器）**

   - 左侧边栏点击 **"Table Editor"**
   - 可视化查看和编辑表数据
   - 类似 Navicat 的表视图

2. **SQL Editor（SQL 编辑器）**

   - 左侧边栏点击 **"SQL Editor"**
   - 直接执行 SQL 查询
   - 保存常用查询

3. **Database（数据库管理）**
   - 查看表结构
   - 管理索引
   - 查看关系图

### 2.5 配置 Supabase 读写分离

Supabase 自动提供读写分离功能：

1. **Connection Pooling（连接池）**

   Supabase 使用 **PgBouncer** 进行连接池管理：

```bash
# 用于应用连接（使用连接池）
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true"

# 用于迁移和管理操作（直连）
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

2. **在代码中使用**

```typescript
// src/lib/database.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### 2.6 测试数据库连接

1. **创建测试脚本 `test-db.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // 测试连接
    await prisma.$connect();
    console.log("✅ Database connected successfully!");

    // 创建测试数据
    const testUser = await prisma.user.create({
      data: {
        githubId: "test123",
        username: "testuser",
        email: "test@example.com"
      }
    });
    console.log("✅ Created test user:", testUser);

    // 查询数据
    const users = await prisma.user.findMany();
    console.log("✅ All users:", users);

    // 删除测试数据
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log("✅ Cleaned up test data");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

2. **运行测试**

```bash
npx tsx test-db.ts
```

### 2.7 Supabase 特性说明

#### ✅ 满足老师要求的特性

1. **Serverless 数据库集群** ✅

   - 自动扩展
   - 按需付费
   - 无需管理服务器

2. **读写分离** ✅

   - PgBouncer 连接池
   - 自动负载均衡
   - 多副本支持（付费版）

3. **管理工具** ✅

   - Web Dashboard 替代 Navicat
   - SQL Editor
   - Table Editor
   - 实时数据查看

4. **免费套餐** ✅
   - 500 MB 数据库存储
   - 50 MB 文件存储
   - 2 GB 带宽/月
   - 无限 API 请求

### 2.8 连接 AWS Lambda 和 Supabase

由于 Supabase 是托管服务（不在您的 VPC 内），Lambda 需要通过 NAT 网关访问：

```
Lambda (私有子网) → NAT Gateway (公有子网) → Internet → Supabase
```

这正是您已经配置好的 VPC 架构！

**环境变量配置**（在 AWS Lambda 中）：

```yaml
Environment:
  Variables:
    NODE_ENV: production
    DATABASE_URL: "postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
    DIRECT_URL: "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

### 2.9 安全最佳实践

1. **使用环境变量存储密码**

   - ✅ 不要将密码提交到 Git
   - ✅ 在 `.env` 文件中配置
   - ✅ 在 `.gitignore` 中排除 `.env`

2. **使用 AWS Secrets Manager（可选）**

   ```bash
   # 存储 Supabase 密码到 AWS Secrets Manager
   aws secretsmanager create-secret \
     --name koa-mpa/supabase-password \
     --secret-string "你的Supabase密码"
   ```

3. **限制 IP 访问（Supabase Pro）**
   - 在 Supabase 项目设置中配置 IP 白名单
   - 只允许 AWS NAT Gateway 的弹性 IP 访问

---

## ✅ 完成检查清单

- [✅] Supabase 项目已创建并处于 Active 状态
- [✅] 已获取数据库连接字符串
- [✅] Prisma schema 已配置为 PostgreSQL
- [✅] 已运行 `prisma migrate dev` 创建表
- [✅] 本地测试连接成功
- [✅] 在 Supabase Dashboard 中能看到创建的表
- [✅] 环境变量已正确配置

恭喜！Supabase 数据库配置完成！🎉

下一步：配置 Lambda 安全组并部署到 AWS
