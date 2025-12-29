import request from '../utils/request';

export interface Course {
  id: number;
  title: string;
  description: string;
  creator_id: number;
  creator?: {
    id: number;
    username: string;
    email: string;
  };
  creator_name?: string;
  creator_avatar?: string;
  category: string;
  cover_url: string;
  max_students: number;
  current_students: number;
  status: 'active' | 'archived';
  is_enrolled?: boolean; // 用户是否已加入该课程
  material_count?: number;
  discussion_count?: number;
  enrolled_at?: string;
  user_role?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseData {
  title: string;
  description?: string;
  category?: string;
  max_students?: number;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  category?: string;
  max_students?: number;
  status?: 'active' | 'archived';
}

export const courseService = {
  // 获取课程列表
  getList: (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
    return request.get('/courses', { params });
  },

  // 获取课程详情
  getDetail: (id: number) => {
    return request.get(`/courses/${id}`);
  },

  // 创建课程
  create: (data: CreateCourseData) => {
    return request.post('/courses', data);
  },

  // 更新课程
  update: (id: number, data: UpdateCourseData) => {
    return request.put(`/courses/${id}`, data);
  },

  // 删除课程
  delete: (id: number) => {
    return request.delete(`/courses/${id}`);
  },

  // 加入课程
  join: (id: number) => {
    return request.post(`/courses/${id}/enroll`);
  },

  // 退出课程
  leave: (id: number) => {
    return request.delete(`/courses/${id}/enroll`);
  },

  // 获取课程成员
  getMembers: (id: number) => {
    return request.get(`/courses/${id}/members`);
  },

  // 获取我的课程列表
  getMyCourses: () => {
    return request.get('/courses/my');
  },
};
