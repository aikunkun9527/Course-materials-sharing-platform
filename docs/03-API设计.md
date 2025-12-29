# 基于云计算的课程资料分享平台 - API设计文档

## 一、API概述

### 1.1 设计原则
- RESTful API设计风格
- 统一的请求/响应格式
- JWT身份认证
- 版本控制：`/api/v1/`
- HTTPS强制加密

### 1.2 通用规范

#### 请求格式
```
Base URL: https://api.yourdomain.com/api/v1
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

#### 响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": { /* 业务数据 */ },
  "timestamp": 1735219200000
}
```

#### 错误响应格式
```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "errors": { /* 详细错误信息 */ },
  "timestamp": 1735219200000
}
```

### 1.3 HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | OK - 请求成功 |
| 201 | Created - 资源创建成功 |
| 400 | Bad Request - 请求参数错误 |
| 401 | Unauthorized - 未认证 |
| 403 | Forbidden - 无权限 |
| 404 | Not Found - 资源不存在 |
| 409 | Conflict - 资源冲突 |
| 422 | Unprocessable Entity - 验证失败 |
| 429 | Too Many Requests - 请求过于频繁 |
| 500 | Internal Server Error - 服务器错误 |

### 1.4 业务状态码

| code | message | 说明 |
|------|---------|------|
| 0 | 成功 | 操作成功 |
| 1001 | 用户不存在 | 用户不存在 |
| 1002 | 密码错误 | 密码错误 |
| 1003 | 邮箱已被注册 | 邮箱已被注册 |
| 1004 | 未登录 | 未登录 |
| 2001 | 课程不存在 | 课程不存在 |
| 2002 | 已是课程成员 | 已是课程成员 |
| 2003 | 不是课程成员 | 不是课程成员 |
| 3001 | 资料不存在 | 资料不存在 |
| 3002 | 文件类型不支持 | 文件类型不支持 |
| 3003 | 文件过大 | 文件过大 |
| 4001 | 讨论不存在 | 讨论不存在 |
| 4002 | 讨论已被锁定 | 讨论已被锁定 |

---

## 二、认证模块 API

### 2.1 用户注册

**请求**
```http
POST /api/v1/auth/register
Content-Type: application/json
```

**请求体**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "username": "张三",
  "role": "student"
}
```

**响应**
```json
{
  "success": true,
  "code": 201,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "username": "张三",
      "role": "student",
      "avatar_url": null,
      "created_at": "2025-12-26T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": 1735219200000
}
```

### 2.2 用户登录

**请求**
```http
POST /api/v1/auth/login
Content-Type: application/json
```

**请求体**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "username": "张三",
      "role": "student",
      "avatar_url": "https://oss.example.com/avatars/1.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": 1735219200000
}
```

### 2.3 刷新Token

**请求**
```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**请求体**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": 1735219200000
}
```

### 2.4 获取当前用户信息

**请求**
```http
GET /api/v1/auth/me
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "email": "student@example.com",
    "username": "张三",
    "role": "student",
    "avatar_url": "https://oss.example.com/avatars/1.jpg",
    "bio": "计算机科学专业学生",
    "email_verified": true,
    "created_at": "2025-12-26T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 2.5 登出

**请求**
```http
POST /api/v1/auth/logout
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "登出成功",
  "data": null,
  "timestamp": 1735219200000
}
```

---

## 三、用户模块 API

### 3.1 更新用户信息

**请求**
```http
PUT /api/v1/users/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "username": "李四",
  "bio": "热爱学习，热爱编程"
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "email": "student@example.com",
    "username": "李四",
    "bio": "热爱学习，热爱编程",
    "avatar_url": "https://oss.example.com/avatars/1.jpg"
  },
  "timestamp": 1735219200000
}
```

### 3.2 上传头像

**请求**
```http
POST /api/v1/users/avatar
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**请求体**
```
avatar: <file>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "上传成功",
  "data": {
    "avatar_url": "https://oss.example.com/avatars/1_new.jpg"
  },
  "timestamp": 1735219200000
}
```

### 3.3 修改密码

**请求**
```http
PUT /api/v1/users/password
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "old_password": "password123",
  "new_password": "newpassword456"
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "密码修改成功",
  "data": null,
  "timestamp": 1735219200000
}
```

### 3.4 获取用户详情（公开）

**请求**
```http
GET /api/v1/users/:id
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "张三",
    "avatar_url": "https://oss.example.com/avatars/1.jpg",
    "bio": "计算机科学专业学生",
    "role": "student"
  },
  "timestamp": 1735219200000
}
```

---

## 四、课程模块 API

### 4.1 获取课程列表

**请求**
```http
GET /api/v1/courses?page=1&limit=20&category=计算机&keyword=数据结构
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| limit | integer | 否 | 每页数量，默认20 |
| category | string | 否 | 课程分类筛选 |
| keyword | string | 否 | 搜索关键词 |
| status | string | 否 | 课程状态：active/archived |

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "数据结构与算法",
        "description": "学习基础数据结构和算法设计",
        "creator": {
          "id": 2,
          "username": "张三",
          "avatar_url": "https://oss.example.com/avatars/2.jpg"
        },
        "category": "计算机",
        "cover_url": "https://oss.example.com/covers/1.jpg",
        "current_students": 120,
        "max_students": 200,
        "material_count": 15,
        "discussion_count": 8,
        "created_at": "2025-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  },
  "timestamp": 1735219200000
}
```

### 4.2 获取课程详情

**请求**
```http
GET /api/v1/courses/:id
Authorization: Bearer <JWT_TOKEN> (可选)
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "数据结构与算法",
    "description": "学习基础数据结构和算法设计，包括链表、树、图等数据结构，以及排序、搜索等算法。",
    "teacher": {
      "id": 2,
      "username": "王教授",
      "avatar_url": "https://oss.example.com/avatars/2.jpg",
      "bio": "计算机系教授，从事算法研究15年"
    },
    "category": "计算机",
    "cover_url": "https://oss.example.com/covers/1.jpg",
    "current_students": 120,
    "max_students": 200,
    "material_count": 15,
    "discussion_count": 8,
    "is_enrolled": false,
    "enrolled_at": null,
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-20T15:30:00Z"
  },
  "timestamp": 1735219200000
}
```

### 4.3 创建课程（所有用户）

**请求**
```http
POST /api/v1/courses
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "机器学习基础",
  "description": "学习机器学习的基本概念和算法",
  "category": "人工智能",
  "max_students": 150,
  "cover_url": "https://oss.example.com/covers/ml.jpg"
}
```

**响应**
```json
{
  "success": true,
  "code": 201,
  "message": "课程创建成功",
  "data": {
    "id": 2,
    "title": "机器学习基础",
    "description": "学习机器学习的基本概念和算法",
    "category": "人工智能",
    "max_students": 150,
    "current_students": 0,
    "created_at": "2025-12-26T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 4.4 更新课程（仅创建者/管理员）

**请求**
```http
PUT /api/v1/courses/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "机器学习基础（修订版）",
  "description": "深入学习机器学习算法原理与应用",
  "max_students": 200
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 2,
    "title": "机器学习基础（修订版）",
    "description": "深入学习机器学习算法原理与应用",
    "updated_at": "2025-12-26T11:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 4.5 加入课程

**请求**
```http
POST /api/v1/courses/:id/enroll
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "加入课程成功",
  "data": {
    "course_id": 1,
    "user_id": 1,
    "role": "student",
    "enrolled_at": "2025-12-26T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 4.6 退出课程

**请求**
```http
DELETE /api/v1/courses/:id/enroll
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "已退出课程",
  "data": null,
  "timestamp": 1735219200000
}
```

### 4.7 获取课程成员列表

**请求**
```http
GET /api/v1/courses/:id/members?page=1&limit=20&role=student
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "members": [
      {
        "id": 1,
        "user": {
          "id": 3,
          "username": "张三",
          "avatar_url": "https://oss.example.com/avatars/3.jpg"
        },
        "role": "student",
        "enrolled_at": "2025-12-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 120
    }
  },
  "timestamp": 1735219200000
}
```

---

## 五、资料模块 API

### 5.1 获取课程资料列表

**请求**
```http
GET /api/v1/courses/:courseId/materials?page=1&limit=20&type=pdf&keyword=算法
Authorization: Bearer <JWT_TOKEN>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码 |
| limit | integer | 否 | 每页数量 |
| type | string | 否 | 文件类型筛选 |
| keyword | string | 否 | 搜索关键词 |
| sort | string | 否 | 排序：latest/hottest |

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "materials": [
      {
        "id": 1,
        "title": "算法导论第三章",
        "description": "排序算法详解",
        "file_name": "算法导论第三章.pdf",
        "file_size": 5242880,
        "file_type": "application/pdf",
        "file_extension": "pdf",
        "uploader": {
          "id": 2,
          "username": "王教授"
        },
        "download_count": 45,
        "created_at": "2025-12-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15
    }
  },
  "timestamp": 1735219200000
}
```

### 5.2 上传资料

**请求**
```http
POST /api/v1/courses/:courseId/materials
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**请求体**
```
file: <file>
title: "算法导论第三章"
description: "排序算法详解"
```

**响应**
```json
{
  "success": true,
  "code": 201,
  "message": "上传成功",
  "data": {
    "id": 1,
    "title": "算法导论第三章",
    "description": "排序算法详解",
    "file_url": "https://oss.example.com/materials/1.pdf",
    "file_name": "算法导论第三章.pdf",
    "file_size": 5242880,
    "file_type": "application/pdf",
    "uploader_id": 2,
    "course_id": 1,
    "created_at": "2025-12-26T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 5.3 获取资料详情

**请求**
```http
GET /api/v1/materials/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "算法导论第三章",
    "description": "排序算法详解",
    "file_name": "算法导论第三章.pdf",
    "file_size": 5242880,
    "file_type": "application/pdf",
    "file_extension": "pdf",
    "file_url": "https://oss.example.com/materials/1.pdf",
    "course_id": 1,
    "course": {
      "id": 1,
      "title": "数据结构与算法"
    },
    "uploader": {
      "id": 2,
      "username": "王教授",
      "avatar_url": "https://oss.example.com/avatars/2.jpg"
    },
    "download_count": 45,
    "is_public": true,
    "created_at": "2025-12-20T10:00:00Z",
    "updated_at": "2025-12-20T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 5.4 下载资料

**请求**
```http
GET /api/v1/materials/:id/download
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取下载链接成功",
  "data": {
    "download_url": "https://oss.example.com/materials/1.pdf?signature=...",
    "expires_at": "2025-12-26T11:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 5.5 更新资料信息

**请求**
```http
PUT /api/v1/materials/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "算法导论第三章（更新版）",
  "description": "排序算法详解，新增快速排序内容"
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "title": "算法导论第三章（更新版）",
    "description": "排序算法详解，新增快速排序内容",
    "updated_at": "2025-12-26T11:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 5.6 删除资料

**请求**
```http
DELETE /api/v1/materials/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1735219200000
}
```

### 5.7 获取OSS上传凭证（前端直传）

**请求**
```http
POST /api/v1/materials/upload-signature
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "file_name": "document.pdf",
  "file_size": 5242880,
  "file_type": "application/pdf",
  "course_id": 1
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "upload_url": "https://oss.example.com/materials/uuid.pdf",
    "signature": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "oss_access_key_id": "LTAI5t...",
    "policy": "eyJleHBpcmF0aW9uIjoiMjAyNS0xMi0yN1QxM...",
    "key": "materials/2025/12/uuid.pdf",
    "expires_at": "2025-12-26T11:00:00Z"
  },
  "timestamp": 1735219200000
}
```

---

## 六、讨论模块 API

### 6.1 获取课程讨论列表

**请求**
```http
GET /api/v1/courses/:courseId/discussions?page=1&limit=20&sort=latest
Authorization: Bearer <JWT_TOKEN>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码 |
| limit | integer | 否 | 每页数量 |
| sort | string | 否 | 排序：latest/hottest/pinned |
| keyword | string | 否 | 搜索关键词 |

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "discussions": [
      {
        "id": 1,
        "title": "如何理解快速排序的时间复杂度？",
        "content": "在分析快速排序时，为什么平均是O(nlogn)？",
        "author": {
          "id": 3,
          "username": "张三",
          "avatar_url": "https://oss.example.com/avatars/3.jpg"
        },
        "view_count": 128,
        "like_count": 15,
        "comment_count": 8,
        "is_pinned": false,
        "is_locked": false,
        "is_liked": false,
        "created_at": "2025-12-25T10:00:00Z",
        "updated_at": "2025-12-26T09:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  },
  "timestamp": 1735219200000
}
```

### 6.2 创建讨论

**请求**
```http
POST /api/v1/courses/:courseId/discussions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "如何理解快速排序的时间复杂度？",
  "content": "在分析快速排序时，为什么平均是O(nlogn)？"
}
```

**响应**
```json
{
  "success": true,
  "code": 201,
  "message": "发布成功",
  "data": {
    "id": 1,
    "course_id": 1,
    "title": "如何理解快速排序的时间复杂度？",
    "content": "在分析快速排序时，为什么平均是O(nlogn)？",
    "author_id": 3,
    "view_count": 0,
    "like_count": 0,
    "comment_count": 0,
    "created_at": "2025-12-26T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 6.3 获取讨论详情

**请求**
```http
GET /api/v1/discussions/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "title": "如何理解快速排序的时间复杂度？",
    "content": "在分析快速排序时，为什么平均是O(nlogn)？",
    "course": {
      "id": 1,
      "title": "数据结构与算法"
    },
    "author": {
      "id": 3,
      "username": "张三",
      "avatar_url": "https://oss.example.com/avatars/3.jpg"
    },
    "view_count": 129,
    "like_count": 15,
    "comment_count": 8,
    "is_pinned": false,
    "is_locked": false,
    "is_liked": false,
    "created_at": "2025-12-25T10:00:00Z",
    "updated_at": "2025-12-26T09:30:00Z"
  },
  "timestamp": 1735219200000
}
```

### 6.4 更新讨论

**请求**
```http
PUT /api/v1/discussions/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "title": "如何理解快速排序的时间复杂度？(补充)",
  "content": "在分析快速排序时，为什么平均是O(nlogn)？最坏情况呢？"
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "title": "如何理解快速排序的时间复杂度？(补充)",
    "content": "在分析快速排序时，为什么平均是O(nlogn)？最坏情况呢？",
    "updated_at": "2025-12-26T10:30:00Z"
  },
  "timestamp": 1735219200000
}
```

### 6.5 删除讨论

**请求**
```http
DELETE /api/v1/discussions/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1735219200000
}
```

### 6.6 点赞/取消点赞讨论

**请求**
```http
POST /api/v1/discussions/:id/like
Authorization: Bearer <JWT_TOKEN>
```

**响应（点赞）**
```json
{
  "success": true,
  "code": 200,
  "message": "点赞成功",
  "data": {
    "liked": true,
    "like_count": 16
  },
  "timestamp": 1735219200000
}
```

**响应（取消点赞）**
```json
{
  "success": true,
  "code": 200,
  "message": "取消点赞成功",
  "data": {
    "liked": false,
    "like_count": 15
  },
  "timestamp": 1735219200000
}
```

---

## 七、评论模块 API

### 7.1 获取讨论评论列表

**请求**
```http
GET /api/v1/discussions/:discussionId/comments?page=1&limit=20
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "快速排序的平均时间复杂度确实是O(nlogn)，这是因为每次分区大约将数组分成两半...",
        "author": {
          "id": 2,
          "username": "王教授",
          "avatar_url": "https://oss.example.com/avatars/2.jpg"
        },
        "parent_id": null,
        "like_count": 5,
        "is_liked": false,
        "created_at": "2025-12-25T12:00:00Z",
        "replies": [
          {
            "id": 2,
            "content": "感谢教授的解答，我明白了！",
            "author": {
              "id": 3,
              "username": "张三",
              "avatar_url": "https://oss.example.com/avatars/3.jpg"
            },
            "parent_id": 1,
            "like_count": 0,
            "is_liked": false,
            "created_at": "2025-12-25T14:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8
    }
  },
  "timestamp": 1735219200000
}
```

### 7.2 创建评论

**请求**
```http
POST /api/v1/discussions/:discussionId/comments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体（一级评论）**
```json
{
  "content": "这是一个很好的问题！"
}
```

**请求体（回复评论）**
```json
{
  "content": "感谢解答！",
  "parent_id": 1
}
```

**响应**
```json
{
  "success": true,
  "code": 201,
  "message": "评论成功",
  "data": {
    "id": 1,
    "discussion_id": 1,
    "content": "这是一个很好的问题！",
    "author_id": 2,
    "parent_id": null,
    "created_at": "2025-12-26T10:00:00Z"
  },
  "timestamp": 1735219200000
}
```

### 7.3 更新评论

**请求**
```http
PUT /api/v1/comments/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**请求体**
```json
{
  "content": "这是一个很好的问题！补充一点..."
}
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "content": "这是一个很好的问题！补充一点...",
    "updated_at": "2025-12-26T10:30:00Z"
  },
  "timestamp": 1735219200000
}
```

### 7.4 删除评论

**请求**
```http
DELETE /api/v1/comments/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "删除成功",
  "data": null,
  "timestamp": 1735219200000
}
```

### 7.5 点赞/取消点赞评论

**请求**
```http
POST /api/v1/comments/:id/like
Authorization: Bearer <JWT_TOKEN>
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "点赞成功",
  "data": {
    "liked": true,
    "like_count": 6
  },
  "timestamp": 1735219200000
}
```

---

## 八、搜索模块 API

### 8.1 全局搜索

**请求**
```http
GET /api/v1/search?q=数据结构&type=all&page=1&limit=20
Authorization: Bearer <JWT_TOKEN>
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| type | string | 否 | 类型：all/course/material/discussion |
| page | integer | 否 | 页码 |
| limit | integer | 否 | 每页数量 |

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "搜索成功",
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "数据结构与算法",
        "type": "course",
        "category": "计算机",
        "creator": "张三",
        "current_students": 120
      }
    ],
    "materials": [
      {
        "id": 1,
        "title": "数据结构讲义第一章",
        "type": "material",
        "course_title": "数据结构与算法",
        "uploader": "王教授"
      }
    ],
    "discussions": [
      {
        "id": 1,
        "title": "数据结构学习心得",
        "type": "discussion",
        "course_title": "数据结构与算法",
        "author": "张三"
      }
    ],
    "total": 15
  },
  "timestamp": 1735219200000
}
```

---

## 九、管理后台 API

### 9.1 获取系统统计

**请求**
```http
GET /api/v1/admin/stats
Authorization: Bearer <JWT_TOKEN> (需要管理员权限)
```

**响应**
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "users": {
      "total": 1500,
      "new_today": 15,
      "students": 1200,
      "creators": 280,
      "admins": 20
    },
    "courses": {
      "total": 85,
      "active": 72,
      "archived": 13
    },
    "materials": {
      "total": 1250,
      "total_size": 5368709120,
      "downloads_today": 320
    },
    "discussions": {
      "total": 450,
      "comments_today": 85
    }
  },
  "timestamp": 1735219200000
}
```

### 9.2 用户管理

#### 获取用户列表
```http
GET /api/v1/admin/users?page=1&limit=20&role=student&status=1
Authorization: Bearer <JWT_TOKEN>
```

#### 禁用/启用用户
```http
PUT /api/v1/admin/users/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": 0
}
```

### 9.3 课程管理

#### 获取所有课程
```http
GET /api/v1/admin/courses?page=1&limit=20&status=active
Authorization: Bearer <JWT_TOKEN>
```

#### 归档课程
```http
PUT /api/v1/admin/courses/:id/archive
Authorization: Bearer <JWT_TOKEN>
```

---

## 十、文件上传处理流程

### 10.1 传统上传方式（通过后端）

```
前端 -> 后端API -> OSS
1. 前端上传文件到后端
2. 后端验证文件
3. 后端上传到OSS
4. 返回文件URL
```

### 10.2 前端直传OSS方式（推荐）

```
前端 -> 后端获取签名 -> 前端直传OSS -> 后端记录
1. 前端请求后端获取OSS签名
2. 后端返回临时上传凭证
3. 前端使用凭证直接上传到OSS
4. 上传成功后通知后端记录文件信息
```

**OSS直传优势**：
- 减轻后端服务器压力
- 上传速度更快
- 节省带宽成本

---

## 十一、API中间件设计

### 11.1 认证中间件
```javascript
// 验证JWT Token
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: '未提供认证Token'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: 'Token无效或已过期'
    });
  }
}
```

### 11.2 授权中间件
```javascript
// 检查用户权限
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权限访问'
      });
    }
    next();
  };
}

// 使用示例
router.post('/courses', authenticate, createCourse); // 所有认证用户都可以创建课程
```

### 11.3 验证中间件
```javascript
// 请求参数验证
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '请求参数错误',
        errors: error.details
      });
    }
    next();
  };
}
```

### 11.4 限流中间件
```javascript
// 请求频率限制
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100个请求
});

app.use('/api/v1', limiter);
```

---

## 十二、错误处理

### 12.1 全局错误处理中间件
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    code: err.code || 500,
    message: err.message || '服务器内部错误',
    errors: err.errors || null,
    timestamp: Date.now()
  });
});
```

### 12.2 常见错误类型
```javascript
// 404 - 资源不存在
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
    this.code = 404;
  }
}

// 409 - 资源冲突
class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.status = 409;
    this.code = 1003; // 邮箱已被注册
  }
}

// 422 - 验证失败
class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.status = 422;
    this.code = 422;
    this.errors = errors;
  }
}
```

---

## 十三、API版本控制

### 13.1 URL版本控制（推荐）
```
/api/v1/courses
/api/v2/courses
```

### 13.2 Header版本控制
```
GET /api/courses
Accept: application/vnd.api.v1+json
```

---

## 十四、API测试工具

### 14.1 Postman集合
建议创建Postman集合进行API测试：
- 认证相关
- 用户管理
- 课程管理
- 资料管理
- 讨论管理
- 评论管理

### 14.2 自动化测试
使用 Jest + Supertest 进行API测试：
```javascript
const request = require('supertest');
const app = require('./app');

describe('POST /api/v1/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        username: '测试用户'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

---

*文档版本: v1.0*
*创建日期: 2025-12-26*
