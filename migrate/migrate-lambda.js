const { Client } = require("pg");

// 迁移 SQL - 来自 prisma/migrations/20251219135914_init/migration.sql
const migrationSQL = `
-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "form_data" (
    "id" TEXT NOT NULL,
    "field1" TEXT NOT NULL,
    "field2" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (使用 IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS "users_githubId_key" ON "users"("githubId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE INDEX IF NOT EXISTS "form_data_userId_idx" ON "form_data"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions"("token");

-- AddForeignKey (需要先检查是否存在)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_data_userId_fkey') THEN
        ALTER TABLE "form_data" ADD CONSTRAINT "form_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_userId_fkey') THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 创建 Prisma 迁移记录表
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("id")
);

-- 记录迁移已执行
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
SELECT
    gen_random_uuid()::text,
    'manual_migration',
    '20251219135914_init',
    now(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20251219135914_init'
);

-- Migration: 20251222064329_make_github_id_optional
ALTER TABLE "users" ALTER COLUMN "githubId" DROP NOT NULL;

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
SELECT
    gen_random_uuid()::text,
    'manual_migration',
    '20251222064329_make_github_id_optional',
    now(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20251222064329_make_github_id_optional'
);

-- Migration: 20251223032910_add_wallet_address
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_walletAddress_key" ON "users"("walletAddress");

INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
SELECT
    gen_random_uuid()::text,
    'manual_migration',
    '20251223032910_add_wallet_address',
    now(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20251223032910_add_wallet_address'
);
`;

exports.handler = async (_event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully");

    console.log("Running migration...");
    await client.query(migrationSQL);
    console.log("Migration completed successfully");

    // 验证表是否创建成功
    const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

    const tables = tablesResult.rows.map((r) => r.table_name);
    console.log("Tables:", tables);

    // 检查 users 表的列
    const columnsResult = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY column_name
        `);

    const columns = columnsResult.rows.map((r) => r.column_name);
    console.log("Users table columns:", columns);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Migration completed successfully",
        tables: tables
      })
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  } finally {
    await client.end();
  }
};
