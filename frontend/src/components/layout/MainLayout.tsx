import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FolderOpenOutlined,
  TeamOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import './MainLayout.css';

const { Header, Content, Sider } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/courses', icon: <BookOutlined />, label: '课程' },
    { key: '/courses/my', icon: <FolderOpenOutlined />, label: '我的课程' },
    ...(user?.role === 'admin'
      ? [{ key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' }]
      : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div className="logo">
          <h1>{collapsed ? '课程' : '课程平台'}</h1>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64, color: 'white' }}
          />
          <div className="header-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/courses/create')}
              style={{ marginRight: 16 }}
            >
              创建课程
            </Button>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-info">
                <Avatar src={user?.avatar_url} icon={<UserOutlined />} />
                <span className="username">{user?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
