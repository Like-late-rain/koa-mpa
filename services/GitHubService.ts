import type { GitHubApi, GitHubUserInfo } from "@/interface/GitHubApi";

/**
 * GitHub 服务
 * 用于通过 Personal Access Token 获取 GitHub 用户信息
 */
class GitHubService implements GitHubApi {
  private readonly apiBaseUrl = "https://api.github.com";

  /**
   * 通过 Personal Access Token 获取 GitHub 用户信息
   * @param token GitHub Personal Access Token
   * @returns GitHub 用户信息
   */
  async getUserByToken(token: string): Promise<GitHubUserInfo> {
    const response = await fetch(`${this.apiBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Koa-MPA-App"
      }
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string };
      throw new Error(errorData.message || `GitHub API 错误: ${response.status}`);
    }

    const userData = await response.json();
    return userData as GitHubUserInfo;
  }

  /**
   * 验证 Token 是否有效
   * @param token GitHub Personal Access Token
   * @returns 是否有效
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.getUserByToken(token);
      return true;
    } catch {
      return false;
    }
  }
}

export default GitHubService;
