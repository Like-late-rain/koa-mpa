import { GET, POST, route } from "awilix-koa";
import type { Context } from "koa";
import type GitHubService from "@services/GitHubService";
import type UserService from "@services/UserService";

@route("/github")
class GitHubController {
  private gitHubService: GitHubService;
  private userService: UserService;

  constructor({
    gitHubService,
    userService
  }: {
    gitHubService: GitHubService;
    userService: UserService;
  }) {
    this.gitHubService = gitHubService;
    this.userService = userService;
  }

  /**
   * 显示 GitHub 登录页面
   */
  @GET()
  async showGitHubPage(ctx: Context): Promise<void> {
    ctx.body = await ctx.render("github-login", {
      title: "GitHub 登录"
    });
  }

  /**
   * 通过 Token 获取 GitHub 用户信息 (API)
   */
  @route("/user")
  @POST()
  async getUserByToken(ctx: Context): Promise<void> {
    try {
      const { token } = ctx.request.body as { token: string };

      if (!token) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Token 不能为空"
        };
        return;
      }

      const gitHubUser = await this.gitHubService.getUserByToken(token);

      ctx.body = {
        success: true,
        message: "获取 GitHub 用户信息成功",
        data: {
          id: gitHubUser.id,
          login: gitHubUser.login,
          name: gitHubUser.name,
          email: gitHubUser.email,
          avatarUrl: gitHubUser.avatar_url,
          bio: gitHubUser.bio,
          publicRepos: gitHubUser.public_repos,
          followers: gitHubUser.followers,
          following: gitHubUser.following,
          profileUrl: gitHubUser.html_url,
          createdAt: gitHubUser.created_at
        }
      };
    } catch (error) {
      console.error("获取 GitHub 用户信息失败:", error);
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: error instanceof Error ? error.message : "获取 GitHub 用户信息失败，请检查 Token 是否有效"
      };
    }
  }

  /**
   * 使用 GitHub Token 登录/注册用户
   */
  @route("/login")
  @POST()
  async loginWithToken(ctx: Context): Promise<void> {
    try {
      const { token } = ctx.request.body as { token: string };

      if (!token) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Token 不能为空"
        };
        return;
      }

      // 获取 GitHub 用户信息
      const gitHubUser = await this.gitHubService.getUserByToken(token);

      // 检查用户是否已存在
      let user = await this.userService.getUserByGithubId(String(gitHubUser.id));

      if (!user) {
        // 创建新用户
        user = await this.userService.createUser({
          githubId: String(gitHubUser.id),
          username: gitHubUser.login,
          email: gitHubUser.email,
          avatarUrl: gitHubUser.avatar_url,
          name: gitHubUser.name
        });
      }

      ctx.body = {
        success: true,
        message: user ? "登录成功" : "注册并登录成功",
        data: {
          user: {
            id: user.id,
            githubId: user.githubId,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            name: user.name
          },
          gitHubProfile: {
            bio: gitHubUser.bio,
            publicRepos: gitHubUser.public_repos,
            followers: gitHubUser.followers,
            following: gitHubUser.following,
            profileUrl: gitHubUser.html_url
          }
        }
      };
    } catch (error) {
      console.error("GitHub 登录失败:", error);
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: error instanceof Error ? error.message : "登录失败，请检查 Token 是否有效"
      };
    }
  }
}

export default GitHubController;
