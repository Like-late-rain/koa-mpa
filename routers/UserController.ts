import { DELETE, GET, POST, route } from "awilix-koa";
import type { Context } from "koa";
import type UserService from "@services/UserService";
import type { CreateUserBody } from "@/interface/UserApi";

@route("/users")
class UserController {
  private userService: UserService;

  constructor({ userService }: { userService: UserService }) {
    this.userService = userService;
  }

  /**
   * 显示用户列表页面
   */
  @GET()
  async listUsers(ctx: Context): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      ctx.body = await ctx.render("user-list", {
        title: "用户列表",
        users
      });
    } catch (error) {
      console.error("获取用户列表失败:", error);
      ctx.throw(500, "获取用户列表失败");
    }
  }

  /**
   * 显示创建用户页面
   */
  @route("/create")
  @GET()
  async showCreateForm(ctx: Context): Promise<void> {
    ctx.body = await ctx.render("create-user", {
      title: "创建新用户"
    });
  }

  /**
   * 处理创建用户请求（手动创建，不需要 GitHub ID）
   */
  @route("/create")
  @POST()
  async createUser(ctx: Context): Promise<void> {
    try {
      const { username, email, name } = ctx.request.body as CreateUserBody;

      if (!username) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "用户名不能为空"
        };
        return;
      }

      const user = await this.userService.createUser({
        username,
        email,
        name
      });

      ctx.body = {
        success: true,
        message: "用户创建成功",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "创建用户失败"
      };
    }
  }

  /**
   * 获取用户详情（API）
   */
  @route("/:id")
  @GET()
  async getUserDetail(ctx: Context): Promise<void> {
    try {
      const id = ctx.params.id;
      const user = await this.userService.getUserById(id);

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "用户不存在"
        };
        return;
      }

      ctx.body = {
        success: true,
        data: user
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取用户详情失败"
      };
    }
  }

  /**
   * 删除用户（API）
   */
  @route("/:id")
  @DELETE()
  async deleteUser(ctx: Context): Promise<void> {
    try {
      const id = ctx.params.id;
      const user = await this.userService.getUserById(id);

      if (!user) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "用户不存在"
        };
        return;
      }

      await this.userService.deleteUser(id);

      ctx.body = {
        success: true,
        message: "用户删除成功"
      };
    } catch (error) {
      console.error("删除用户失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "删除用户失败"
      };
    }
  }
}

export default UserController;
