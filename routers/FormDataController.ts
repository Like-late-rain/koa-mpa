import { GET, POST, route } from "awilix-koa";
import type { Context } from "koa";
import type FormDataService from "@services/FormDataService";
import type { CreateFormDataBody, UpdateFormDataBody } from "@/interface/FormDataApi";

@route("/form-data")
class FormDataController {
  private formDataService: FormDataService;

  constructor({ formDataService }: { formDataService: FormDataService }) {
    this.formDataService = formDataService;
  }

  /**
   * 显示表单数据列表页面
   */
  @GET()
  async listFormData(ctx: Context): Promise<void> {
    try {
      const formDataList = await this.formDataService.getAllFormData();
      ctx.body = await ctx.render("form-data-list", {
        title: "表单数据列表",
        formDataList
      });
    } catch (error) {
      console.error("获取表单数据列表失败:", error);
      ctx.throw(500, "获取表单数据列表失败");
    }
  }

  /**
   * 显示创建表单页面
   */
  @route("/create")
  @GET()
  async showCreateForm(ctx: Context): Promise<void> {
    ctx.body = await ctx.render("form-data-create", {
      title: "创建表单数据"
    });
  }

  /**
   * 创建表单数据 (API)
   */
  @route("/create")
  @POST()
  async createFormData(ctx: Context): Promise<void> {
    try {
      const { field1, field2, userId } = ctx.request.body as CreateFormDataBody;

      if (!field1 || !field2) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "字段1和字段2不能为空"
        };
        return;
      }

      const formData = await this.formDataService.createFormData({
        field1,
        field2,
        userId: userId || null
      });

      ctx.body = {
        success: true,
        message: "表单数据创建成功",
        data: formData
      };
    } catch (error) {
      console.error("创建表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建表单数据失败"
      };
    }
  }

  /**
   * 获取表单数据详情 (API)
   */
  @route("/:id")
  @GET()
  async getFormDataDetail(ctx: Context): Promise<void> {
    try {
      const id = ctx.params.id;
      const formData = await this.formDataService.getFormDataById(id);

      if (!formData) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "表单数据不存在"
        };
        return;
      }

      ctx.body = {
        success: true,
        data: formData
      };
    } catch (error) {
      console.error("获取表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取表单数据失败"
      };
    }
  }

  /**
   * 更新表单数据 (API)
   */
  @route("/:id")
  @POST()
  async updateFormData(ctx: Context): Promise<void> {
    try {
      const id = ctx.params.id;
      const { field1, field2 } = ctx.request.body as UpdateFormDataBody;

      const existingData = await this.formDataService.getFormDataById(id);
      if (!existingData) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "表单数据不存在"
        };
        return;
      }

      const updatedData: UpdateFormDataBody = {};
      if (field1 !== undefined) updatedData.field1 = field1;
      if (field2 !== undefined) updatedData.field2 = field2;

      const formData = await this.formDataService.updateFormData(id, updatedData);

      ctx.body = {
        success: true,
        message: "表单数据更新成功",
        data: formData
      };
    } catch (error) {
      console.error("更新表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新表单数据失败"
      };
    }
  }

  /**
   * 删除表单数据 (API)
   */
  @route("/:id/delete")
  @POST()
  async deleteFormData(ctx: Context): Promise<void> {
    try {
      const id = ctx.params.id;

      const existingData = await this.formDataService.getFormDataById(id);
      if (!existingData) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "表单数据不存在"
        };
        return;
      }

      await this.formDataService.deleteFormData(id);

      ctx.body = {
        success: true,
        message: "表单数据删除成功"
      };
    } catch (error) {
      console.error("删除表单数据失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除表单数据失败"
      };
    }
  }
}

export default FormDataController;
