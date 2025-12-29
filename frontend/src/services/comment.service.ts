import request from '../utils/request';

export interface Comment {
  id: number;
  discussion_id: number;
  author_id: number;
  author?: {
    id: number;
    username: string;
    avatar_url: string;
  };
  parent_id: number | null;
  content: string;
  like_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface CreateCommentData {
  discussion_id: number;
  content: string;
  parent_id?: number;
}

export const commentService = {
  // 获取讨论的评论列表
  getByDiscussionId: (discussionId: number, params?: { page?: number; limit?: number }) => {
    return request.get(`/comments/discussion/${discussionId}`, { params });
  },

  // 创建评论
  create: (data: CreateCommentData) => {
    return request.post('/comments', data);
  },

  // 更新评论
  update: (id: number, data: { content: string }) => {
    return request.put(`/comments/${id}`, data);
  },

  // 删除评论
  delete: (id: number) => {
    return request.delete(`/comments/${id}`);
  },

  // 点赞/取消点赞（切换）
  like: (id: number) => {
    return request.post(`/comments/${id}/like`);
  },
};
