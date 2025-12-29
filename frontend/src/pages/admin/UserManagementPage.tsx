import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Popconfirm,
  Select,
  Input,
} from 'antd';
import {
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/user.service';
import type { UserProfile } from '../../services/user.service';
import './UserManagementPage.css';

const { Search } = Input;

const UserManagementPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    role: undefined as string | undefined,
    status: undefined as number | undefined,
    keyword: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getList({
        page: pagination.current,
        limit: pagination.pageSize,
        role: filters.role,
        status: filters.status,
        keyword: filters.keyword || undefined,
      });
      if (response.data) {
        setUsers(response.data.users || []);
        setPagination({
          ...pagination,
          total: response.data.pagination?.total || 0,
        });
      }
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, status: number) => {
    try {
      await userService.updateStatus(userId, { status });
      message.success('状态更新成功');
      fetchUsers();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await userService.deleteUser(userId);
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        if (role === 'admin') return <Tag color="red">管理员</Tag>;
        if (role === 'student') return <Tag color="blue">学生</Tag>;
        return <Tag>{role}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number, record: UserProfile) => {
        const isCurrentUser = record.id === currentUser?.id;
        return (
          <Tag color={status === 1 ? 'green' : 'default'}>
            {status === 1 ? '正常' : '已禁用'}
          </Tag>
        );
      },
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: UserProfile) => {
        const isCurrentUser = record.id === currentUser?.id;
        return (
          <Space>
            {record.status === 1 ? (
              <Popconfirm
                title="确定要禁用该用户吗？"
                description="禁用后用户将无法登录"
                onConfirm={() => handleStatusChange(record.id, 0)}
                disabled={isCurrentUser}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<LockOutlined />}
                  disabled={isCurrentUser}
                >
                  禁用
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm
                title="确定要启用该用户吗？"
                onConfirm={() => handleStatusChange(record.id, 1)}
              >
                <Button
                  type="link"
                  size="small"
                  icon={<UnlockOutlined />}
                >
                  启用
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="确定要删除该用户吗？"
              description="删除后无法恢复"
              onConfirm={() => handleDelete(record.id)}
              disabled={isCurrentUser}
            >
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={isCurrentUser}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const handleTableChange = (newPagination: any) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  return (
    <div className="user-management-page">
      <Card title="用户管理" className="management-card">
        <div className="filter-section">
          <Space>
            <Select
              placeholder="筛选角色"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, role: value })}
              value={filters.role}
            >
              <Select.Option value="student">学生</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) =>
                setFilters({ ...filters, status: value !== undefined ? parseInt(value) : undefined })
              }
              value={filters.status !== undefined ? String(filters.status) : undefined}
            >
              <Select.Option value="1">正常</Select.Option>
              <Select.Option value="0">已禁用</Select.Option>
            </Select>
            <Search
              placeholder="搜索用户名或邮箱"
              allowClear
              style={{ width: 200 }}
              onSearch={(value) => setFilters({ ...filters, keyword: value })}
              enterButton
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          className="user-table"
        />
      </Card>
    </div>
  );
};

export default UserManagementPage;
