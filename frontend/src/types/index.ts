/**
 * 通用类型定义
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
  role: 'student' | 'admin';
  bio?: string;
  status?: number;
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  creator_id: number;
  creator_name?: string;
  creator_avatar?: string;
  category?: string;
  cover_url?: string;
  current_students: number;
  max_students?: number;
  material_count?: number;
  discussion_count?: number;
  status: 'active' | 'archived';
  is_enrolled?: boolean;
  enrolled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  course_id: number;
  uploader_id: number;
  uploader_name?: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  download_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: number;
  course_id: number;
  author_id: number;
  author_name?: string;
  author_avatar?: string;
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

export interface Comment {
  id: number;
  discussion_id: number;
  author_id: number;
  author_name?: string;
  author_avatar?: string;
  parent_id?: number;
  content: string;
  like_count: number;
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}
