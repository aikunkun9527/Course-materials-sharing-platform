import axios, { AxiosError } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store/authStore';

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data, config } = response;

    // 如果是 blob 响应，直接返回整个 response（因为需要访问 headers）
    if (config.responseType === 'blob') {
      return response;
    }

    // 统一处理响应格式
    if (data.success === false) {
      message.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message || '请求失败'));
    }

    return data;
  },
  (error: AxiosError<any>) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 401:
          // 未认证，清除token并跳转登录
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          message.error('登录已过期，请重新登录');
          break;
        case 403:
          message.error(data?.message || '无权限访问');
          break;
        case 404:
          message.error(data?.message || '资源不存在');
          break;
        case 500:
          message.error(data?.message || '服务器错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时');
    } else {
      message.error('网络错误');
    }

    return Promise.reject(error);
  }
);

export default request;
