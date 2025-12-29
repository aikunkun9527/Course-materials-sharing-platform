import request from '../utils/request';

export interface Material {
  id: number;
  course_id: number;
  uploader_id: number;
  uploader?: {
    id: number;
    username: string;
  };
  uploader_name?: string; // 后端返回的上传者名称
  title: string;
  description: string;
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

export interface CreateMaterialData {
  course_id: number;
  title: string;
  description?: string;
  file: File;
}

export const materialService = {
  // 获取课程资料列表
  getByCourseId: (courseId: number, params?: { page?: number; limit?: number }) => {
    return request.get(`/materials/course/${courseId}`, { params });
  },

  // 获取资料详情
  getDetail: (id: number) => {
    return request.get(`/materials/${id}`);
  },

  // 上传资料（服务端）
  upload: (data: FormData) => {
    return request.post('/materials', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取上传签名（前端直传）
  getUploadSignature: (data: { file_name: string; file_size: number; file_type: string }) => {
    return request.post('/materials/upload-signature', data);
  },

  // 确认上传（前端直传后调用）
  confirmUpload: (data: {
    course_id: number;
    title: string;
    description?: string;
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
  }) => {
    return request.post('/materials/confirm-upload', data);
  },

  // 下载资料
  download: (id: number) => {
    return request.get(`/materials/${id}/download`, {
      responseType: 'blob',
    });
  },

  // 删除资料
  delete: (id: number) => {
    return request.delete(`/materials/${id}`);
  },

  // 搜索资料
  search: (params: { keyword?: string; course_id?: number; page?: number; limit?: number }) => {
    return request.get('/materials/search', { params });
  },
};
