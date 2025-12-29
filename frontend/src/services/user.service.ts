import request from '../utils/request';

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  avatar_url: string;
  role: 'student' | 'admin';
  bio: string;
  status: number;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  bio?: string;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export const userService = {
  // 获取当前用户信息
  getProfile: () => {
    return request.get('/users/profile');
  },

  // 更新个人资料
  updateProfile: (data: UpdateProfileData) => {
    return request.put('/users/profile', data);
  },

  // 上传头像
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 修改密码
  changePassword: (data: ChangePasswordData) => {
    return request.post('/users/change-password', data);
  },

  // 获取用户详情（通过ID）
  getUserById: (id: number) => {
    return request.get(`/users/${id}`);
  },

  // 获取用户列表（管理员）
  getList: (params?: { page?: number; limit?: number; role?: string; status?: number }) => {
    return request.get('/users', { params });
  },

  // 更新用户状态（管理员）
  updateStatus: (id: number, data: { status: number }) => {
    return request.put(`/users/${id}/status`, data);
  },

  // 删除用户（管理员）
  deleteUser: (id: number) => {
    return request.delete(`/users/${id}`);
  },
};
