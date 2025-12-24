import type UserService from "@services/UserService";
import { DELETE, GET, POST, PUT, route } from "awilix-koa";
import { verifyMessage } from "ethers";
import type { Context } from "koa";
import type { CreateUserBody, UpdateUserBody } from "@/interface/UserApi";

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
      console.error("创建用户失败:", error);
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
      console.error("获取用户详情失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "获取用户详情失败"
      };
    }
  }

  /**
   * 更新用户信息（API）
   */
  @route("/:id")
  @PUT()
  async updateUser(ctx: Context): Promise<void> {
    try {
      const id = ctx.params.id;
      const updateData = ctx.request.body as UpdateUserBody;

      // 验证用户是否存在
      const existingUser = await this.userService.getUserById(id);
      if (!existingUser) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "用户不存在"
        };
        return;
      }

      // 提取验证字段（signature 和 timestamp 用于验证，不存储到数据库）
      const { signature, timestamp, ...userUpdateData } = updateData;

      // 签名验证逻辑（用于钱包用户）
      if (signature && timestamp) {
        // 检查用户是否有钱包地址
        if (!existingUser.walletAddress) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: "该用户未绑定钱包地址，无需签名验证"
          };
          return;
        }

        // 验证时间戳是否在有效期内（5分钟）
        const now = Date.now();
        const timeDiff = Math.abs(now - timestamp);
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (timeDiff > FIVE_MINUTES) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: "签名已过期，请重新签名"
          };
          return;
        }

        try {
          // 构建签名消息（需要与前端保持一致）
          // 前端格式: 更新个人信息\n\n名称: ${nickname}\n地址: ${account}\n时间戳: ${timestamp}
          const nickname = userUpdateData.name || existingUser.name || "";
          const message = `更新个人信息\n\n名称: ${nickname}\n地址: ${existingUser.walletAddress}\n时间戳: ${timestamp}`;

          // 验证签名并恢复地址
          const recoveredAddress = verifyMessage(message, signature);
          console.log("恢复的地址:", recoveredAddress.toLowerCase());
          console.log("用户的钱包地址:", existingUser.walletAddress.toLowerCase());
          // 验证恢复的地址是否与用户的钱包地址匹配
          if (recoveredAddress.toLowerCase() !== existingUser.walletAddress.toLowerCase()) {
            ctx.status = 403;
            ctx.body = {
              success: false,
              message: "签名验证失败：钱包地址不匹配"
            };
            return;
          }
        } catch (error) {
          console.error("签名验证错误:", error);
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: "签名格式无效"
          };
          return;
        }
      } else if (existingUser.walletAddress) {
        // 如果用户有钱包地址但没有提供签名，拒绝更新
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "钱包用户必须提供签名才能更新信息"
        };
        return;
      }

      // 更新用户信息（只传递数据库字段）
      const updatedUser = await this.userService.updateUser(id, userUpdateData);

      ctx.body = {
        success: true,
        message: "用户信息更新成功",
        data: updatedUser
      };
    } catch (error) {
      console.error("更新用户信息失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "更新用户信息失败"
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

  /**
   * 钱包登录/注册（API）
   */
  @route("/wallet-login")
  @POST()
  async walletLogin(ctx: Context): Promise<void> {
    try {
      const { walletAddress } = ctx.request.body as { walletAddress: string };

      if (!walletAddress) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "钱包地址不能为空"
        };
        return;
      }

      const user = await this.userService.walletLogin(walletAddress);

      ctx.body = {
        success: true,
        data: user
      };
    } catch (error) {
      console.error("钱包登录失败:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "钱包登录失败"
      };
    }
  }
}

export default UserController;
