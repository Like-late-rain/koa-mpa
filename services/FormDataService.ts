import type PrismaService from "./PrismaService";
import type {
  CreateFormDataBody,
  UpdateFormDataBody,
  FormDataBody,
  FormDataApi
} from "@/interface/FormDataApi";
import type { PrismaClient } from "@generated/prisma";

/**
 * 表单数据服务
 * 用于管理表单数据的增删改查
 */
class FormDataService implements FormDataApi {
  private prisma: PrismaClient;

  constructor({ prismaService }: { prismaService: PrismaService }) {
    this.prisma = prismaService.getClient();
  }

  /**
   * 获取所有表单数据
   */
  async getAllFormData(): Promise<FormDataBody[]> {
    return await this.prisma.formData.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * 根据 ID 获取表单数据
   */
  async getFormDataById(id: string): Promise<FormDataBody | null> {
    return await this.prisma.formData.findUnique({
      where: { id }
    });
  }

  /**
   * 根据用户 ID 获取表单数据
   */
  async getFormDataByUserId(userId: string): Promise<FormDataBody[]> {
    return await this.prisma.formData.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * 创建表单数据
   */
  async createFormData(data: CreateFormDataBody): Promise<FormDataBody> {
    return await this.prisma.formData.create({
      data
    });
  }

  /**
   * 更新表单数据
   */
  async updateFormData(
    id: string,
    data: UpdateFormDataBody
  ): Promise<FormDataBody> {
    return await this.prisma.formData.update({
      where: { id },
      data
    });
  }

  /**
   * 删除表单数据
   */
  async deleteFormData(id: string): Promise<FormDataBody> {
    return await this.prisma.formData.delete({
      where: { id }
    });
  }
}

export default FormDataService;
