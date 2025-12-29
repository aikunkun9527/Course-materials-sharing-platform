import { Card, Row, Col, Statistic, Spin } from 'antd';
import { BookOutlined, UserOutlined, FileTextOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { courseService } from '../../services/course.service';
import { useEffect, useState } from 'react';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myCourses: 0,
    materials: 0,
    discussions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 获取我的课程列表
      const response = await courseService.getMyCourses();
      console.log('=== Full response object ===');
      console.log('Response:', JSON.stringify(response, null, 2));
      console.log('Response.data:', response.data);
      console.log('Response.data?.courses:', response.data?.courses);

      if (response.data && response.data.courses) {
        const courses = response.data.courses;
        console.log('Courses array:', courses);
        console.log('Courses array length:', courses.length);

        // 计算统计数据
        let totalMaterials = 0;
        let totalDiscussions = 0;

        courses.forEach((course: any) => {
          console.log('Processing course:', course);
          // 确保课程有效（有id）才统计
          if (course.id) {
            totalMaterials += course.material_count || 0;
            totalDiscussions += course.discussion_count || 0;
          }
        });

        const newStats = {
          myCourses: courses.length,
          materials: totalMaterials,
          discussions: totalDiscussions,
        };
        console.log('=== Setting stats ===');
        console.log('New stats:', newStats);
        setStats(newStats);
      } else {
        console.log('=== No courses in response ===');
        console.log('Response structure check failed:');
        console.log('- Has response.data:', !!response.data);
        console.log('- Has response.data.courses:', !!response.data?.courses);
        // 如果没有课程，设置默认值
        setStats({
          myCourses: 0,
          materials: 0,
          discussions: 0,
        });
      }
    } catch (error) {
      console.error('=== Failed to fetch stats ===');
      console.error('Error:', error);
      // 出错时设置默认值
      setStats({
        myCourses: 0,
        materials: 0,
        discussions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h1>欢迎回来，{user?.username}！</h1>
        <p>开始探索课程资料，与同学交流学习心得</p>
      </div>

      <Row gutter={[16, 16]} className="stats-section">
        <Col xs={24} sm={12} md={8}>
          <Card hoverable onClick={() => navigate('/courses/my')}>
            <Spin spinning={loading}>
              <Statistic title="我的课程" value={stats.myCourses} prefix={<BookOutlined />} valueStyle={{ color: '#3f8600' }} />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Spin spinning={loading}>
              <Statistic title="学习资料" value={stats.materials} prefix={<FileTextOutlined />} valueStyle={{ color: '#cf1322' }} />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Spin spinning={loading}>
              <Statistic title="讨论帖子" value={stats.discussions} prefix={<MessageOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Card title="快捷入口" className="quick-links">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              className="quick-link-card"
              onClick={() => navigate('/courses')}
            >
              <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <h3>浏览课程</h3>
              <p>探索更多精彩课程</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              className="quick-link-card"
              onClick={() => navigate('/courses')}
            >
              <FileTextOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <h3>学习资料</h3>
              <p>查看课程学习资料</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              hoverable
              className="quick-link-card"
              onClick={() => navigate('/courses')}
            >
              <MessageOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
              <h3>讨论区</h3>
              <p>参与学习讨论</p>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default HomePage;
