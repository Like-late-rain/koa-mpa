import type { PrismaClient } from "@generated/prisma";
import { prisma } from "@lib/prisma";

/**
 * Prisma 数据库服务
 * 使用全局 PrismaClient 实例，避免重复创建连接
 */
class PrismaService {
  /**
   * 获取全局 Prisma Client 实例
   */
  public getClient(): PrismaClient {
    return prisma;
  }
}

export default PrismaService;
