import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Avatar,
  Spin,
  Empty,
  List,
  Form,
  Input,
  message,
  Popconfirm,
  Descriptions,
} from 'antd';
import {
  UserOutlined,
  LikeOutlined,
  MessageOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { discussionService } from '../../services/discussion.service';
import { commentService } from '../../services/comment.service';
import type { Discussion } from '../../services/discussion.service';
import type { Comment as CommentType } from '../../services/comment.service';
import './DiscussionDetailPage.css';

const { TextArea } = Input;

const DiscussionDetailPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [liking, setLiking] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchDiscussionDetail();
      fetchComments();
    }
  }, [id]);

  const fetchDiscussionDetail = async () => {
    setLoading(true);
    try {
      const response = await discussionService.getDetail(Number(id));
      if (response.data) {
        setDiscussion(response.data);
      }
    } catch (error) {
      message.error('获取讨论详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    setCommentLoading(true);
    try {
      const response = await commentService.getByDiscussionId(Number(id));
      if (response.data) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      message.error('获取评论列表失败');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLike = async () => {
    if (!discussion) return;
    setLiking(true);
    try {
      // 后端使用toggle设计，始终调用同一个API
      const response = await discussionService.like(discussion.id);

      // 根据返回结果更新本地状态，避免重新获取导致浏览次数增加
      if (response.data) {
        setDiscussion({
          ...discussion,
          is_liked: response.data.liked,
          like_count: discussion.like_count + (response.data.liked ? 1 : -1),
        });
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLiking(false);
    }
  };

  const handleCreateComment = async (values: any) => {
    if (!id) return;
    try {
      await commentService.create({
        discussionId: Number(id),
        content: values.content,
        parentId: replyingTo || undefined,
      });
      message.success('评论成功');
      commentForm.resetFields();
      setReplyingTo(null);
      fetchComments();
      fetchDiscussionDetail(); // 更新评论数
    } catch (error) {
      message.error('评论失败');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.delete(commentId);
      message.success('删除成功');
      fetchComments();
      fetchDiscussionDetail(); // 更新评论数
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleLikeComment = async (commentId: number, isLiked: boolean) => {
    try {
      // 后端使用toggle设计，始终调用同一个API
      await commentService.like(commentId);
      fetchComments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const renderComment = (comment: CommentType) => {
    const isAuthor = comment.author_id === user?.id;
    const isAdmin = user?.role === 'admin';
    const canDelete = isAuthor || isAdmin;

    return (
      <div key={comment.id} className="comment-item">
        <div className="comment-header">
          <Avatar src={comment.author_avatar} icon={<UserOutlined />} />
          <div className="comment-meta">
            <span className="comment-author">{comment.author_name}</span>
            <span className="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
          </div>
        </div>
        <div className="comment-content">{comment.content}</div>
        <div className="comment-actions">
          <span
            className="action-item"
            onClick={() => handleLikeComment(comment.id, comment.is_liked || false)}
          >
            <LikeOutlined />
            {comment.like_count > 0 && ` ${comment.like_count}`}
          </span>
          <span
            className="action-item"
            onClick={() => setReplyingTo(comment.id)}
          >
            <MessageOutlined /> 回复
          </span>
          {canDelete && (
            <Popconfirm
              title="确定要删除这条评论吗？"
              onConfirm={() => handleDeleteComment(comment.id)}
              okText="确定"
              cancelText="取消"
            >
              <span className="action-item danger">
                <DeleteOutlined /> 删除
              </span>
            </Popconfirm>
          )}
        </div>
        {replyingTo === comment.id && (
          <Form form={commentForm} onFinish={handleCreateComment} style={{ marginTop: 16 }}>
            <Form.Item name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
              <TextArea
                rows={2}
                placeholder={`回复 ${comment.author_name}`}
                autoFocus
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="small">
                发表回复
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setReplyingTo(null);
                  commentForm.resetFields();
                }}
              >
                取消
              </Button>
            </Form.Item>
          </Form>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="replies">
            {comment.replies.map((reply) => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  if (loading || !discussion) {
    return <div className="loading-container"><Spin size="large" /></div>;
  }

  const isAuthor = discussion.author_id === user?.id;
  const isAdmin = user?.role === 'admin';
  const canDeleteDiscussion = isAuthor || isAdmin;

  return (
    <div className="discussion-detail-page">
      <div className="page-header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/courses/${discussion.course_id}`)}>
          返回课程
        </Button>
      </div>

      <Card className="discussion-card">
        <div className="discussion-header">
          <h1>
            {discussion.is_pinned === true && <Tag color="red">置顶</Tag>}
            {discussion.is_locked === true && <Tag color="orange">锁定</Tag>}
            {discussion.title}
          </h1>
          <div className="discussion-meta">
            <Avatar
              src={discussion.author_avatar}
              icon={<UserOutlined />}
              size="small"
            />
            <span className="author-name">{discussion.author_name}</span>
            <span className="publish-time">
              发布于 {new Date(discussion.created_at).toLocaleString()}
            </span>
            {canDeleteDiscussion && (
              <Popconfirm
                title="确定要删除这条讨论吗？"
                description="删除后无法恢复，所有评论也将被删除"
                onConfirm={async () => {
                  try {
                    await discussionService.delete(discussion.id);
                    message.success('删除成功');
                    navigate(`/courses/${discussion.course_id}`);
                  } catch (error) {
                    message.error('删除失败');
                  }
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />} size="small">
                  删除讨论
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>

        <div className="discussion-content">{discussion.content}</div>

        <div className="discussion-stats">
          <Button
            icon={<LikeOutlined />}
            onClick={handleLike}
            loading={liking}
            type={discussion.is_liked ? 'primary' : 'default'}
          >
            {discussion.like_count > 0 ? ` ${discussion.like_count}` : ' 点赞'}
          </Button>
          <Button
            icon={<MessageOutlined />}
            onClick={() => {
              const commentsSection = document.querySelector('.comments-card');
              if (commentsSection) {
                commentsSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {discussion.comment_count} 评论
          </Button>
          <span className="view-count">
            浏览 {discussion.view_count}
          </span>
        </div>
      </Card>

      <Card className="comments-card" title="评论">
        {!discussion.is_locked && (
          <Form form={commentForm} onFinish={handleCreateComment} className="comment-form">
            <Form.Item name="content" rules={[{ required: true, message: '请输入评论内容' }]}>
              <TextArea rows={4} placeholder="发表你的评论..." />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                发表评论
              </Button>
            </Form.Item>
          </Form>
        )}

        {discussion.is_locked && (
          <div className="locked-message">
            该讨论已被锁定，暂无法发表评论
          </div>
        )}

        <Spin spinning={commentLoading}>
          {comments.length === 0 ? (
            <Empty description="暂无评论" />
          ) : (
            <div className="comments-list">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default DiscussionDetailPage;
