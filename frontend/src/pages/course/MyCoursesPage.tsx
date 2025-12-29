import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Empty,
  Spin,
  message,
  Popconfirm,
  Space,
} from 'antd';
import {
  BookOutlined,
  UserOutlined,
  DeleteOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { courseService } from '../../services/course.service';
import type { Course } from '../../services/course.service';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    setLoading(true);
    try {
      const response = await courseService.getMyCourses();
      if (response.data && response.data.courses) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      message.error('获取我的课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCourse = async (courseId: number) => {
    try {
      await courseService.leave(courseId);
      message.success('退出成功');
      fetchMyCourses();
    } catch (error) {
      message.error('退出失败');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    try {
      await courseService.delete(courseId);
      message.success('删除成功');
      fetchMyCourses();
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div className="my-courses-page">
      <div className="page-header">
        <Button icon={<LeftOutlined />} onClick={() => navigate('/courses')}>
          返回课程列表
        </Button>
        <h1>我的课程</h1>
      </div>

      <Spin spinning={loading}>
        {courses.length === 0 ? (
          <Empty
            description="你还没有加入任何课程"
            style={{ marginTop: '100px' }}
          />
        ) : (
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
                        <UserOutlined /> {course.creator_name || '未知'}
                      </span>
                      <span>
                        {course.current_students}/{course.max_students || '无限制'}
                      </span>
                    </div>
                    <div className="course-stats">
                      <span>📁 {course.material_count || 0} 份资料</span>
                      <span>💬 {course.discussion_count || 0} 个讨论</span>
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
                      ) : (
                        <Popconfirm
                          title="确定要退出这门课程吗？"
                          description="退出后将无法查看课程资料"
                          onConfirm={() => handleLeaveCourse(course.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button block>退出课程</Button>
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default MyCoursesPage;
