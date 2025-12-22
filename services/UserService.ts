import type PrismaService from "./PrismaService";
import type {
  CreateUserBody,
  UpdateUserBody,
  UserBody,
  UserApi,
  UserInfoBody
} from "@/interface/UserApi";
import type { PrismaClient } from "@generated/prisma";

/**
 * 用户服务
 * 用于 GitHub OAuth 用户管理
 */
class UserService implements UserApi {
  private prisma: PrismaClient;

  constructor({ prismaService }: { prismaService: PrismaService }) {
    this.prisma = prismaService.getClient();
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<UserBody[]> {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        githubId: true,
        username: true,
        email: true,
        avatarUrl: true,
        name: true,
        createdAt: true
      }
    });
  }

  /**
   * 根据 ID 获取用户
   */
  async getUserById(id: string): Promise<UserInfoBody | null> {
    return await this.prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<UserInfoBody | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * 根据 GitHub ID 获取用户
   */
  async getUserByGithubId(githubId: string): Promise<UserInfoBody | null> {
    return await this.prisma.user.findUnique({
      where: { githubId }
    });
  }

  /**
   * 创建用户
   */
  async createUser(data: CreateUserBody): Promise<UserInfoBody> {
    return await this.prisma.user.create({
      data
    });
  }

  /**
   * 更新用户
   */
  async updateUser(id: string, data: UpdateUserBody): Promise<UserInfoBody> {
    return await this.prisma.user.update({
      where: { id },
      data
    });
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<UserInfoBody> {
    return await this.prisma.user.delete({
      where: { id }
    });
  }
}

export default UserService;
