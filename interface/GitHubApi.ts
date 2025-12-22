// GitHub 用户信息响应体
export type GitHubUserInfo = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

// GitHub API 错误响应
export type GitHubApiError = {
  message: string;
  documentation_url?: string;
};

export interface GitHubApi {
  getUserByToken(token: string): Promise<GitHubUserInfo>;
}
