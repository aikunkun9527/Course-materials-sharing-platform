import request from '../utils/request';

export interface Discussion {
  id: number;
  course_id: number;
  author_id: number;
  author?: {
    id: number;
    username: string;
    avatar_url: string;
  };
  title: string;
  content: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscussionData {
  course_id: number;
  title: string;
  content: string;
}

export const discussionService = {
  // 获取课程讨论列表
  getByCourseId: (courseId: number, params?: { page?: number; limit?: number }) => {
    return request.get(`/discussions/course/${courseId}`, { params });
  },

  // 获取讨论详情
  getDetail: (id: number) => {
    return request.get(`/discussions/${id}`);
  },

  // 创建讨论
  create: (data: CreateDiscussionData) => {
    return request.post('/discussions', data);
  },

  // 更新讨论
  update: (id: number, data: { title?: string; content?: string }) => {
    return request.put(`/discussions/${id}`, data);
  },

  // 删除讨论
  delete: (id: number) => {
    return request.delete(`/discussions/${id}`);
  },

  // 点赞/取消点赞（切换）
  like: (id: number) => {
    return request.post(`/discussions/${id}/like`);
  },

  // 置顶/取消置顶（管理员权限）
  pin: (id: number) => {
    return request.put(`/discussions/${id}/pin`);
  },

  // 锁定/取消锁定（管理员权限）
  lock: (id: number) => {
    return request.put(`/discussions/${id}/lock`);
  },
};
