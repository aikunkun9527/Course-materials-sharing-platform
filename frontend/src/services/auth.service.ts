import request from '../utils/request';
import type { ApiResponse } from '../types';

interface RegisterData {
  email: string;
  password: string;
  username: string;
  role?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

interface AuthResponse {
  user: any;
  token: string;
  refresh_token: string;
}

export const authService = {
  /**
   * 用户注册
   */
  register: (data: RegisterData) =>
    request.post<any, ApiResponse<AuthResponse>>('/auth/register', data),

  /**
   * 用户登录
   */
  login: (data: LoginData) =>
    request.post<any, ApiResponse<AuthResponse>>('/auth/login', data),

  /**
   * 获取当前用户信息
   */
  me: () => request.get<any, ApiResponse>('/auth/me'),

  /**
   * 刷新Token
   */
  refreshToken: (refreshToken: string) =>
    request.post<any, ApiResponse<{ token: string; refresh_token: string }>>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  /**
   * 登出
   */
  logout: () => request.post<any, ApiResponse>('/auth/logout'),

  /**
   * 修改密码
   */
  changePassword: (data: ChangePasswordData) =>
    request.put<any, ApiResponse>('/users/password', data),
};
