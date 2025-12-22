// 定义创建用户的请求体（支持手动创建和 GitHub OAuth）
export type CreateUserBody = {
  githubId?: string | null; // GitHub 登录时自动填充，手动创建时可选
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
};

// 定义更新用户的请求体
export type UpdateUserBody = {
  email?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
};

// 定义获取用户列表的响应体
export type UserBody = {
  id: string;
  githubId: string | null; // 手动创建的用户可能没有 GitHub ID
  username: string;
  email: string | null;
  avatarUrl: string | null;
  name: string | null;
  createdAt: Date;
};

// 定义获取单个用户的响应体
export type UserInfoBody = {
  id: string;
  githubId: string | null; // 手动创建的用户可能没有 GitHub ID
  username: string;
  email: string | null;
  avatarUrl: string | null;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserApi {
  getAllUsers(): Promise<UserBody[]>;
  getUserById(id: string): Promise<UserInfoBody | null>;
  getUserByEmail(email: string): Promise<UserInfoBody | null>;
  getUserByGithubId(githubId: string): Promise<UserInfoBody | null>;
  createUser(data: CreateUserBody): Promise<UserInfoBody>;
  updateUser(id: string, data: UpdateUserBody): Promise<UserInfoBody>;
  deleteUser(id: string): Promise<UserInfoBody>;
}
