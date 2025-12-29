import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Pagination,
  Empty,
  Spin,
  Form,
  message,
  Popconfirm,
  Space,
} from 'antd';
import { SearchOutlined, BookOutlined, UserOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { courseService } from '../../services/course.service';
import type { Course } from '../../services/course.service';
import './CourseListPage.css';

const { Search } = Input;
const { Option } = Select;

const CourseListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 });
  const [filters, setFilters] = useState({ category: '', search: '' });

  useEffect(() => {
    fetchCourses();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getList({
        page: pagination.current,
        limit: pagination.pageSize,
        category: filters.category || undefined,
        keyword: filters.search || undefined,
      });
      if (response.data) {
        setCourses(response.data.courses || []);
        setPagination({
          ...pagination,
          total: response.data.total || 0,
        });
      }
    } catch (error) {
      message.error('获取课程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleCategoryChange = (value: string) => {
    setFilters({ ...filters, category: value });
    setPagination({ ...pagination, current: 1 });
  };

  const handleJoinCourse = async (courseId: number) => {
    try {
      await courseService.join(courseId);
      message.success('加入成功');

      // 立即更新本地状态，创建新数组以确保触发重新渲染
      setCourses(prevCourses => prevCourses.map(course =>
        course.id === courseId
          ? { ...course, is_enrolled: true, current_students: course.current_students + 1 }
          : course
      ));
    } catch (error: any) {
      // 如果错误是因为已经是成员，刷新列表以同步状态
      const errorMessage = error.response?.data?.message || error.message || '加入失败';
      if (errorMessage.includes('已经') || error.response?.status === 409) {
        // 刷新列表以获取正确的状态
        fetchCourses();
      }
      // 错误消息已在 request.ts 中显示，这里不再重复显示
    }
  };

  const handleLeaveCourse = async (courseId: number) => {
    try {
      await courseService.leave(courseId);
      message.success('退出成功');

      // 立即更新本地状态，创建新数组以确保触发重新渲染
      setCourses(prevCourses => prevCourses.map(course =>
        course.id === courseId
          ? { ...course, is_enrolled: false, current_students: Math.max(0, course.current_students - 1) }
          : course
      ));
    } catch (error) {
      // 错误消息已在 request.ts 中显示，这里不再重复显示
      // 仍然刷新列表以同步状态
      fetchCourses();
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await courseService.delete(courseId);
      message.success('删除成功');
      fetchCourses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div className="course-list-page">
      <div className="page-header">
        <h1>课程列表</h1>
      </div>

      <div className="filters-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Search
              placeholder="搜索课程名称或描述"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="选择分类"
              size="large"
              style={{ width: '100%' }}
              allowClear
              onChange={handleCategoryChange}
            >
              <Option value="计算机科学与技术">计算机科学与技术</Option>
              <Option value="软件工程">软件工程</Option>
              <Option value="人工智能">人工智能</Option>
              <Option value="电子信息">电子信息</Option>
              <Option value="机械工程">机械工程</Option>
              <Option value="土木工程">土木工程</Option>
              <Option value="数学">数学</Option>
              <Option value="物理">物理</Option>
              <Option value="化学">化学</Option>
              <Option value="生物科学">生物科学</Option>
              <Option value="经济学">经济学</Option>
              <Option value="管理学">管理学</Option>
              <Option value="金融学">金融学</Option>
              <Option value="法学">法学</Option>
              <Option value="文学">文学</Option>
              <Option value="历史学">历史学</Option>
              <Option value="哲学">哲学</Option>
              <Option value="外国语">外国语</Option>
              <Option value="新闻传播">新闻传播</Option>
              <Option value="艺术设计">艺术设计</Option>
              <Option value="医学">医学</Option>
              <Option value="教育学">教育学</Option>
              <Option value="心理学">心理学</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {courses.length === 0 ? (
          <Empty description="暂无课程" />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {courses.map((course) => (
                <Col xs={24} sm={12} md={8} lg={6} key={course.id}>
                  <Card
                    hoverable
                    className="course-card"
                    cover={
                      course.cover_url ? (
                        <div className="course-cover">
                          <img alt={course.title} src={course.cover_url} />
                        </div>
                      ) : (
                        <div className="course-cover default">
                          <BookOutlined />
                        </div>
                      )
                    }
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <div className="course-info">
                      <Tag color="blue">{course.category || '未分类'}</Tag>
                      <h3 className="course-title">{course.title}</h3>
                      <p className="course-description">{course.description || '暂无描述'}</p>
                      <div className="course-meta">
                        <span>
                          <UserOutlined /> {course.creator_name || course.creator?.username || '未知'}
                        </span>
                        <span>
                          {course.current_students}/{course.max_students || '无限制'}
                        </span>
                      </div>
                      <div className="course-actions" onClick={(e) => e.stopPropagation()}>
                        {course.creator_id === user?.id ? (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Button block>我的课程</Button>
                            <Popconfirm
                              title="确定要删除这门课程吗？"
                              description="删除后无法恢复，所有相关资料和讨论也将被删除。"
                              onConfirm={() => handleDeleteCourse(course.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button danger block icon={<DeleteOutlined />}>
                                删除课程
                              </Button>
                            </Popconfirm>
                          </Space>
                        ) : course.is_enrolled ? (
                          <Popconfirm
                            title="确定要退出这门课程吗？"
                            description="退出后将无法查看课程资料"
                            onConfirm={() => handleLeaveCourse(course.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button block>
                              已加入
                            </Button>
                          </Popconfirm>
                        ) : (
                          <Button
                            type="primary"
                            block
                            onClick={() => handleJoinCourse(course.id)}
                          >
                            加入课程
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="pagination-section">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) =>
                  setPagination({ ...pagination, current: page, pageSize })
                }
                showSizeChanger
                showTotal={(total) => `共 ${total} 门课程`}
              />
            </div>
          </>
        )}
      </Spin>
    </div>
  );
};

export default CourseListPage;
