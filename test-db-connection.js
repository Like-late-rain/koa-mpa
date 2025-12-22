// 测试直接连接 MariaDB
require('dotenv/config');
const mariadb = require('mariadb');

async function testConnection() {
  console.log('开始测试数据库连接...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const url = new URL(process.env.DATABASE_URL);
  console.log('\n解析后的连接信息:');
  console.log('Host:', url.hostname);
  console.log('Port:', url.port);
  console.log('User:', url.username);
  console.log('Database:', url.pathname.slice(1));
  console.log('Password:', url.password ? '***已设置***' : '未设置');

  let pool;
  try {
    console.log('\n创建连接池...');
    pool = mariadb.createPool({
      host: url.hostname,
      port: Number(url.port),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      connectionLimit: 5,
      connectTimeout: 10000
    });

    console.log('连接池创建成功，尝试获取连接...');
    const conn = await pool.getConnection();
    console.log('✅ 成功获取数据库连接！');

    console.log('\n执行测试查询...');
    const rows = await conn.query('SELECT 1 as test');
    console.log('✅ 查询成功:', rows);

    console.log('\n检查 users 表...');
    const users = await conn.query('SELECT * FROM users LIMIT 1');
    console.log('✅ users 表查询成功，记录数:', users.length);

    conn.release();
    console.log('\n✅ 所有测试通过！数据库连接正常。');
  } catch (error) {
    console.error('\n❌ 数据库连接失败:');
    console.error('错误类型:', error.code);
    console.error('错误信息:', error.message);
    console.error('\n完整错误:', error);

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n可能的原因:');
      console.error('1. 网络无法访问数据库服务器（防火墙/白名单）');
      console.error('2. 数据库服务器地址或端口错误');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n可能的原因:');
      console.error('1. 用户名或密码错误');
      console.error('2. 该用户没有访问该数据库的权限');
    }
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n连接池已关闭');
    }
  }
}

testConnection();
