import React from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import type { LoginData, RegisterData } from '../../services/auth.service';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = React.useState(false);

  // 登录
  const onLoginFinish = async (values: LoginData) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      if (response.data) {
        setAuth(response.data.user, response.data.token);
        message.success('登录成功');
        navigate('/');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const onRegisterFinish = async (values: RegisterData & { confirmPassword?: string }) => {
    setLoading(true);
    // 移除 confirmPassword 字段
    const { confirmPassword, ...registerData } = values;
    try {
      const response = await authService.register(registerData as RegisterData);
      if (response.data) {
        setAuth(response.data.user, response.data.token);
        message.success('注册成功');
        navigate('/');
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>课程资料分享平台</h1>
          <p>基于云计算的在线学习平台</p>
        </div>

        <Card className="login-card">
          <Tabs
            defaultActiveKey="login"
            centered
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Form name="login" onFinish={onLoginFinish} autoComplete="off" size="large">
                    <Form.Item
                      name="email"
                      rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="邮箱" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block>
                        登录
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <Form name="register" onFinish={onRegisterFinish} autoComplete="off" size="large">
                    <Form.Item
                      name="email"
                      rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="邮箱" />
                    </Form.Item>

                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名' }, { min: 2, message: '用户名至少2个字符' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6个字符' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: '请确认密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block>
                        注册
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
