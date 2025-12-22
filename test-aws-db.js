/**
 * AWS RDS 数据库连接测试脚本
 * 运行此脚本来验证你的 AWS RDS 数据库连接是否正常
 */

require('dotenv/config');
const mariadb = require('mariadb');

async function testConnection() {
  console.log('🔍 开始测试 AWS RDS 数据库连接...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ 错误：未找到 DATABASE_URL 环境变量');
    console.log('请确保在 .env 或 .env.aws 文件中设置了 DATABASE_URL');
    process.exit(1);
  }

  console.log('📝 数据库连接信息：');
  // 隐藏密码显示
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`   ${maskedUrl}\n`);

  let pool;
  let conn;

  try {
    // 创建连接池
    console.log('1️⃣ 创建连接池...');
    pool = mariadb.createPool({
      connectionLimit: 5,
      connectTimeout: 30000,
      socketTimeout: 30000,
      acquireTimeout: 30000,
      url: databaseUrl
    });
    console.log('   ✅ 连接池创建成功\n');

    // 获取连接
    console.log('2️⃣ 获取数据库连接...');
    conn = await pool.getConnection();
    console.log('   ✅ 成功连接到数据库\n');

    // 测试查询
    console.log('3️⃣ 执行测试查询...');
    const rows = await conn.query('SELECT VERSION() as version, DATABASE() as db_name, USER() as user');
    console.log('   ✅ 查询成功');
    console.log('   MySQL 版本:', rows[0].version);
    console.log('   当前数据库:', rows[0].db_name);
    console.log('   当前用户:', rows[0].user);
    console.log('');

    // 检查表是否存在
    console.log('4️⃣ 检查数据库表...');
    const tables = await conn.query('SHOW TABLES');
    if (tables.length === 0) {
      console.log('   ⚠️  数据库中还没有表');
      console.log('   请运行 "yarn prisma:migrate:deploy" 来创建表');
    } else {
      console.log('   ✅ 找到以下表:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log('      -', tableName);
      });
    }
    console.log('');

    console.log('✅ 所有测试通过！AWS RDS 数据库连接正常。\n');

  } catch (error) {
    console.error('\n❌ 连接失败！\n');
    console.error('错误详情：', error.message);
    console.error('');

    // 提供常见问题的解决方案
    console.log('💡 常见问题排查：');
    console.log('');
    console.log('1. 检查 DATABASE_URL 是否正确');
    console.log('   - 用户名和密码是否正确');
    console.log('   - RDS 终端节点是否正确');
    console.log('   - 数据库名称是否存在');
    console.log('');
    console.log('2. 检查网络配置');
    console.log('   - 如果在本地运行，RDS 的 "公开访问" 需要设置为 "是"');
    console.log('   - 或者使用 VPN/堡垒机连接到 VPC');
    console.log('');
    console.log('3. 检查安全组规则');
    console.log('   - RDS 安全组是否允许你的 IP 地址访问（端口 3306）');
    console.log('   - 在 RDS 控制台 → 安全组 → 入站规则中添加你的 IP');
    console.log('');

    process.exit(1);
  } finally {
    if (conn) await conn.release();
    if (pool) await pool.end();
  }
}

// 运行测试
testConnection();
