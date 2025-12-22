import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function testDatabaseConnection() {
  console.log("🔍 测试数据库连接...\n");

  try {
    // 1. 测试连接
    console.log("1️⃣ 测试数据库连接...");
    await prisma.$connect();
    console.log("✅ 数据库连接成功！\n");

    // 2. 创建测试用户 (Create)
    console.log("2️⃣ 测试 CREATE 操作 - 创建测试用户...");
    const testUser = await prisma.user.create({
      data: {
        githubId: `test-${Date.now()}`,
        username: "test-user",
        email: `test-${Date.now()}@example.com`,
        avatarUrl: "https://github.com/identicons/test.png",
        name: "Test User",
      },
    });
    console.log("✅ 创建用户成功:", testUser);
    console.log();

    // 3. 读取用户 (Read)
    console.log("3️⃣ 测试 READ 操作 - 查询用户...");
    const users = await prisma.user.findMany({
      take: 5,
    });
    console.log(`✅ 查询到 ${users.length} 个用户`);
    console.log();

    // 4. 创建表单数据并关联用户
    console.log("4️⃣ 测试创建表单数据...");
    const formData = await prisma.formData.create({
      data: {
        field1: "测试字段1",
        field2: "测试字段2",
        userId: testUser.id,
      },
      include: {
        user: true,
      },
    });
    console.log("✅ 创建表单数据成功:", formData);
    console.log();

    // 5. 更新用户 (Update)
    console.log("5️⃣ 测试 UPDATE 操作 - 更新用户信息...");
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        name: "Updated Test User",
      },
    });
    console.log("✅ 更新用户成功:", updatedUser);
    console.log();

    // 6. 测试关联查询
    console.log("6️⃣ 测试关联查询 - 查询用户及其表单数据...");
    const userWithFormData = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        formData: true,
        sessions: true,
      },
    });
    console.log("✅ 关联查询成功:");
    console.log(`   用户: ${userWithFormData?.name}`);
    console.log(`   表单数量: ${userWithFormData?.formData.length}`);
    console.log();

    // 7. 删除测试数据 (Delete)
    console.log("7️⃣ 测试 DELETE 操作 - 清理测试数据...");
    await prisma.formData.delete({
      where: { id: formData.id },
    });
    console.log("✅ 删除表单数据成功");

    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log("✅ 删除用户成功");
    console.log();

    // 8. 统计信息
    console.log("8️⃣ 数据库统计信息...");
    const userCount = await prisma.user.count();
    const formDataCount = await prisma.formData.count();
    const sessionCount = await prisma.session.count();
    console.log(`✅ 用户总数: ${userCount}`);
    console.log(`✅ 表单数据总数: ${formDataCount}`);
    console.log(`✅ 会话总数: ${sessionCount}`);
    console.log();

    console.log("🎉 所有测试通过！数据库连接和 CRUD 操作正常！");
  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\n👋 数据库连接已关闭");
  }
}

// 运行测试
testDatabaseConnection();
