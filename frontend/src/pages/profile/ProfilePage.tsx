import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  message,
  Descriptions,
  Modal,
  Avatar,
  Tabs,
  Row,
  Col,
} from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/user.service';
import { authService } from '../../services/auth.service';
import type { UserProfile } from '../../services/user.service';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await userService.getProfile();
      if (response.data) {
        setProfile(response.data);
        profileForm.setFieldsValue({
          username: response.data.username,
          bio: response.data.bio,
        });
        // 同时更新 authStore 中的 user 信息
        setUser(response.data);
      }
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const response = await userService.updateProfile(values);
      if (response.data) {
        message.success('更新成功');
        setProfile(response.data);
        setUser(response.data);
      }
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setAvatarLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setAvatarLoading(false);
      message.success('头像上传成功');
      fetchProfile();
    }
    if (info.file.status === 'error') {
      setAvatarLoading(false);
      message.error('头像上传失败');
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      return false;
    }
    return true;
  };

  const handleChangePassword = async (values: any) => {
    try {
      // 移除 confirm_password 字段
      const { confirm_password, ...passwordData } = values;
      await authService.changePassword(passwordData);
      message.success('密码修改成功，请重新登录');
      passwordForm.resetFields();
      setPasswordModalVisible(false);
      setTimeout(() => {
        authService.logout();
        window.location.href = '/login';
      }, 1000);
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  const uploadButton = (hasAvatar: boolean) => (
    <div>
      {avatarLoading ? <span>上传中...</span> : <UploadOutlined />}
      <div style={{ marginTop: 8 }}>
        {hasAvatar ? '更换头像' : '上传头像'}
      </div>
    </div>
  );

  if (!profile) {
    return <div>加载中...</div>;
  }

  return (
    <div className="profile-page">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card title="个人信息" className="profile-card">
            <div className="avatar-section">
              <Avatar size={120} src={profile.avatar_url} icon={<UserOutlined />} />
              <Upload
                name="avatar"
                listType="picture-circle"
                className="avatar-uploader"
                showUploadList={false}
                action={`${import.meta.env.VITE_API_BASE_URL}/users/avatar`}
                headers={{
                  Authorization: `Bearer ${useAuthStore.getState().token}`,
                }}
                beforeUpload={beforeUpload}
                onChange={handleAvatarChange}
              >
                {uploadButton(!!profile.avatar_url)}
              </Upload>
            </div>
            <Descriptions column={1} bordered className="profile-info">
              <Descriptions.Item label="邮箱">{profile.email}</Descriptions.Item>
              <Descriptions.Item label="角色">
                {profile.role === 'student' && '学生'}
                {profile.role === 'admin' && '管理员'}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱状态">
                {profile.email_verified ? '已验证' : '未验证'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {new Date(profile.created_at).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card className="profile-tabs-card">
            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: '基本资料',
                  children: (
                    <Form
                      form={profileForm}
                      layout="vertical"
                      onFinish={handleUpdateProfile}
                    >
                      <Form.Item
                        label="用户名"
                        name="username"
                        rules={[
                          { required: true, message: '请输入用户名' },
                          { min: 2, message: '用户名至少2个字符' },
                        ]}
                      >
                        <Input placeholder="请输入用户名" />
                      </Form.Item>

                      <Form.Item label="个人简介" name="bio">
                        <Input.TextArea rows={4} placeholder="介绍一下自己" />
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                          保存修改
                        </Button>
                      </Form.Item>
                    </Form>
                  ),
                },
                {
                  key: 'security',
                  label: '安全设置',
                  children: (
                    <div className="security-section">
                      <h3>修改密码</h3>
                      <Button
                        type="primary"
                        icon={<LockOutlined />}
                        onClick={() => setPasswordModalVisible(true)}
                      >
                        修改密码
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            label="当前密码"
            name="old_password"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
