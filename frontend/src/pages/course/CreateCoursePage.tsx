import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Spin, InputNumber, Select } from 'antd';
import { BookOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import './CreateCoursePage.css';

const { TextArea } = Input;
const { Option } = Select;

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const categories = [
    '计算机科学与技术',
    '软件工程',
    '人工智能',
    '电子信息',
    '机械工程',
    '土木工程',
    '数学',
    '物理',
    '化学',
    '生物科学',
    '经济学',
    '管理学',
    '金融学',
    '法学',
    '文学',
    '历史学',
    '哲学',
    '外国语',
    '新闻传播',
    '艺术设计',
    '医学',
    '教育学',
    '心理学',
    '其他',
  ];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await courseService.create({
        title: values.title,
        description: values.description || '',
        category: values.category || '',
        cover_url: values.cover_url || '',
        max_students: values.max_students || null,
      });

      message.success('课程创建成功！');
      navigate('/courses/my');
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-course-page">
      <Card
        title={
          <div className="page-header">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="back-button"
            >
              返回
            </Button>
            <BookOutlined className="title-icon" />
            <span>创建新课程</span>
          </div>
        }
        className="create-course-card"
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
            className="create-course-form"
          >
            <Form.Item
              label="课程标题"
              name="title"
              rules={[
                { required: true, message: '请输入课程标题' },
                { min: 2, message: '课程标题至少2个字符' },
                { max: 200, message: '课程标题最多200个字符' },
              ]}
            >
              <Input placeholder="请输入课程标题" size="large" />
            </Form.Item>

            <Form.Item
              label="课程分类"
              name="category"
            >
              <Select placeholder="请选择课程分类" size="large" allowClear>
                {categories.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="课程描述"
              name="description"
              rules={[
                { max: 2000, message: '课程描述最多2000个字符' },
              ]}
            >
              <TextArea
                rows={6}
                placeholder="请输入课程描述（选填）"
                maxLength={2000}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="封面图片URL"
              name="cover_url"
              rules={[
                { type: 'url', message: '请输入有效的URL' },
              ]}
            >
              <Input placeholder="https://example.com/image.jpg" />
            </Form.Item>

            <Form.Item
              label="最大学生人数"
              name="max_students"
              rules={[
                { type: 'number', min: 1, message: '最大学生人数至少为1' },
              ]}
            >
              <InputNumber
                placeholder="不限制"
                min={1}
                style={{ width: '100%' }}
                size="large"
              />
            </Form.Item>

            <Form.Item className="form-actions">
              <Button onClick={() => navigate(-1)} size="large">
                取消
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading}>
                创建课程
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default CreateCoursePage;
