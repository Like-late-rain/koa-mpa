import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 检查数据库 URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// 判断是否需要 SSL（本地开发不需要，AWS 需要）
const isProduction = process.env.NODE_ENV === "production";
const isAWS = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// 创建 PostgreSQL 连接池
const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 5, // 最大连接数
  // 只在 AWS 环境启用 SSL
  ...(isProduction || isAWS
    ? {
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {})
});

// 创建 Prisma PostgreSQL 适配器
const adapter = new PrismaPg(pool);

// 创建全局 PrismaClient 实例
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

// 数据库预热函数 - 用于唤醒 Aurora Serverless v2（ACU=0 时需要）
export async function warmupDatabase(): Promise<boolean> {
  try {
    console.log("🔄 正在唤醒数据库...");
    const startTime = Date.now();

    // 执行简单查询来唤醒数据库
    await prisma.$queryRaw`SELECT 1`;

    const duration = Date.now() - startTime;
    console.log(`✅ 数据库已唤醒，耗时 ${duration}ms`);
    return true;
  } catch (error) {
    console.error("❌ 数据库唤醒失败:", error);
    return false;
  }
}

// 连接数据库
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // 预热数据库（对于 Aurora Serverless v2 ACU=0 的情况）
    await warmupDatabase();
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }
}

// 启动时连接
connectDatabase();

// 优雅关闭
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
