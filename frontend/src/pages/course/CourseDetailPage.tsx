import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Descriptions,
  Tag,
  Modal,
  Form,
  Input,
  Upload,
  message,
  List,
  Avatar,
  Spin,
  Empty,
  Popconfirm,
} from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  MessageOutlined,
  UploadOutlined,
  UserOutlined,
  LeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { courseService } from '../../services/course.service';
import { materialService } from '../../services/material.service';
import { discussionService } from '../../services/discussion.service';
import type { Course, Material, Discussion } from '../../services/course.service';
import './CourseDetailPage.css';

const { TextArea } = Input;
const { Search } = Input;

const CourseDetailPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [discussionModalVisible, setDiscussionModalVisible] = useState(false);
  const [uploadForm] = Form.useForm();
  const [discussionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('info');
  const downloadingIds = React.useRef(new Set<number>());

  useEffect(() => {
    if (id) {
      fetchCourseDetail();
      if (activeTab === 'materials') fetchMaterials();
      if (activeTab === 'discussions') fetchDiscussions();
    }
  }, [id, activeTab]);

  const fetchCourseDetail = async () => {
    setLoading(true);
    try {
      const response = await courseService.getDetail(Number(id));
      if (response.data) {
        setCourse(response.data);
      }
    } catch (error) {
      message.error('获取课程详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await materialService.getByCourseId(Number(id));
      if (response.data) {
        setMaterials(response.data.materials || []);
      }
    } catch (error) {
      message.error('获取资料列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await discussionService.getByCourseId(Number(id));
      if (response.data) {
        setDiscussions(response.data.discussions || []);
      }
    } catch (error) {
      message.error('获取讨论列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMaterial = async (values: any) => {
    const { file, title, description } = values;

    // 检查file对象是否存在
    if (!file || !file.fileList || file.fileList.length === 0) {
      message.error('请选择文件');
      return;
    }

    const formData = new FormData();
    formData.append('courseId', id!);

    const fileObj = file.fileList[0].originFileObj;

    // 创建一个新的 File 对象，确保文件名使用正确的编码
    // 使用 Blob 构造函数来创建新的 File 对象
    const encodedFileName = new File([fileObj], fileObj.name, {
      type: fileObj.type,
    });

    formData.append('file', encodedFileName);
    formData.append('title', title);
    if (description) formData.append('description', description);

    // 同时也发送原始文件名，作为后者的备选
    formData.append('originalFileName', fileObj.name);

    try {
      await materialService.upload(formData);
      message.success('上传成功');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      fetchMaterials();
    } catch (error) {
      message.error('上传失败');
    }
  };

  const handleCreateDiscussion = async (values: any) => {
    try {
      await discussionService.create({
        courseId: Number(id),
        ...values,
      });
      message.success('发布成功');
      setDiscussionModalVisible(false);
      discussionForm.resetFields();
      fetchDiscussions();
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleDeleteDiscussion = async (discussionId: number) => {
    try {
      await discussionService.delete(discussionId);
      message.success('删除成功');
      fetchDiscussions();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    try {
      await materialService.delete(materialId);
      message.success('删除成功');
      fetchMaterials();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDeleteCourse = async () => {
    try {
      await courseService.delete(Number(id));
      message.success('删除成功');
      navigate('/courses');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleDownload = async (materialId: number) => {
    // 防止重复点击
    if (downloadingIds.current.has(materialId)) {
      message.warning('正在下载中，请稍候');
      return;
    }

    try {
      downloadingIds.current.add(materialId);

      const response = await materialService.download(materialId);

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'download';

      if (contentDisposition) {
        try {
          // 优先使用 RFC 5987 标准的 filename*
          const utf8FileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\s]+)/i);
          if (utf8FileNameMatch && utf8FileNameMatch[1]) {
            fileName = decodeURIComponent(utf8FileNameMatch[1]);
          } else {
            // 回退到普通的 filename
            const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
            if (fileNameMatch && fileNameMatch[1]) {
              fileName = fileNameMatch[1];
            }
          }
        } catch (e) {
          console.error('Error parsing filename:', e);
        }
      }

      // 创建 Blob 并下载
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();

      // 清理
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);

      message.success('下载开始');

      // 下载成功后才移除标记
      downloadingIds.current.delete(materialId);
    } catch (error) {
      console.error('Download error:', error);
      message.error('下载失败');
      // 发生错误时也要移除标记
      downloadingIds.current.delete(materialId);
    }
  };

  if (!course) {
    return <div className="loading-container"><Spin size="large" /></div>;
  }

  return (
    <div className="course-detail-page">
      <div className="page-header">
        <Button icon={<LeftOutlined />} onClick={() => navigate('/courses')}>
          返回课程列表
        </Button>
        <h1>{course.title}</h1>
        {(course.creator_id === user?.id || user?.role === 'admin') && (
          <Popconfirm
            title="确定要删除这个课程吗?"
            description="删除后无法恢复,所有相关资料和讨论也会被删除"
            onConfirm={handleDeleteCourse}
            okText="确定"
            cancelText="取消"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              删除课程
            </Button>
          </Popconfirm>
        )}
      </div>

      <Card className="course-info-card">
        <Descriptions column={2}>
          <Descriptions.Item label="创建者">
            {course.creator_name || course.creator?.username || '未知'}
          </Descriptions.Item>
          <Descriptions.Item label="课程分类">
            <Tag color="blue">{course.category || '未分类'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="学生人数">
            {course.current_students}/{course.max_students || '无限制'}
          </Descriptions.Item>
          <Descriptions.Item label="课程状态">
            <Tag color={course.status === 'active' ? 'green' : 'default'}>
              {course.status === 'active' ? '进行中' : '已归档'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="课程描述" span={2}>
            {course.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="course-content-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'materials',
              label: '课程资料',
              children: (
                <>
                  <div className="tab-header">
                    <h3>课程资料</h3>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => setUploadModalVisible(true)}
                    >
                      上传资料
                    </Button>
                  </div>

                  <Spin spinning={loading}>
                    {materials.length === 0 ? (
                      <Empty description="暂无资料" />
                    ) : (
                      <List
                        dataSource={materials}
                        renderItem={(item) => (
                          <List.Item
                            actions={[
                              <Button
                                type="link"
                                onClick={() => handleDownload(item.id)}
                              >
                                下载
                              </Button>,
                              ...(item.uploader_id === user?.id || user?.role === 'admin' ? [
                                <Popconfirm
                                  key="delete"
                                  title="确定要删除这份资料吗?"
                                  description="删除后无法恢复"
                                  onConfirm={() => handleDeleteMaterial(item.id)}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <Button
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                  >
                                    删除
                                  </Button>
                                </Popconfirm>,
                              ] : []),
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar icon={<FileTextOutlined />} />}
                              title={item.title}
                              description={
                                <div>
                                  {item.description && <div style={{ marginBottom: 8 }}>{item.description}</div>}
                                  <div>上传者: {item.uploader_name || item.uploader?.username || '未知'}</div>
                                  <div>
                                    大小: {(item.file_size / 1024).toFixed(2)} KB | 下载次数: {item.download_count}
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Spin>
                </>
              ),
            },
            {
              key: 'discussions',
              label: '讨论区',
              children: (
                <>
                  <div className="tab-header">
                    <h3>课程讨论</h3>
                    <Button
                      type="primary"
                      icon={<MessageOutlined />}
                      onClick={() => setDiscussionModalVisible(true)}
                    >
                      发起讨论
                    </Button>
                  </div>

                  <Spin spinning={loading}>
                    {discussions.length === 0 ? (
                      <Empty description="暂无讨论" />
                    ) : (
                      <List
                        dataSource={discussions}
                        renderItem={(item) => (
                          <List.Item
                            className="discussion-list-item"
                            onClick={() => navigate(`/discussions/${item.id}`)}
                            actions={
                              (item.author_id === user?.id || user?.role === 'admin') ? [
                                <Popconfirm
                                  key="delete"
                                  title="确定要删除这条讨论吗？"
                                  description="删除后无法恢复"
                                  onConfirm={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDiscussion(item.id);
                                  }}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <Button
                                    type="link"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    删除
                                  </Button>
                                </Popconfirm>,
                              ] : undefined
                            }
                          >
                            <List.Item.Meta
                              avatar={<Avatar src={item.author?.avatar_url} icon={<UserOutlined />} />}
                              title={
                                <>
                                  {item.is_pinned === true && <Tag color="red">置顶</Tag>}
                                  {item.title}
                                </>
                              }
                              description={
                                <div>
                                  <div>{item.author?.username} · {new Date(item.created_at).toLocaleString()}</div>
                                  <div className="discussion-content">{item.content}</div>
                                  <div className="discussion-stats">
                                    <span>浏览: {item.view_count}</span>
                                    <span>点赞: {item.like_count}</span>
                                    <span>评论: {item.comment_count}</span>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </Spin>
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="上传资料"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUploadMaterial}>
          <Form.Item label="资料标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入资料标题" />
          </Form.Item>

          <Form.Item label="资料描述" name="description">
            <TextArea rows={3} placeholder="请输入资料描述" />
          </Form.Item>

          <Form.Item
            label="选择文件"
            name="file"
            rules={[{ required: true, message: '请选择文件' }]}
            valuePropName="file"
          >
            <Upload
              maxCount={1}
              beforeUpload={() => false}
              onRemove={() => {
                uploadForm.setFieldsValue({ file: null });
                return true;
              }}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              上传
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发起讨论"
        open={discussionModalVisible}
        onCancel={() => setDiscussionModalVisible(false)}
        footer={null}
      >
        <Form form={discussionForm} layout="vertical" onFinish={handleCreateDiscussion}>
          <Form.Item label="讨论标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="请输入讨论标题" />
          </Form.Item>

          <Form.Item label="讨论内容" name="content" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="请输入讨论内容" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              发布
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseDetailPage;
