import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/home/HomePage';
import ProfilePage from './pages/profile/ProfilePage';
import CourseListPage from './pages/course/CourseListPage';
import CourseDetailPage from './pages/course/CourseDetailPage';
import MyCoursesPage from './pages/course/MyCoursesPage';
import CreateCoursePage from './pages/course/CreateCoursePage';
import DiscussionDetailPage from './pages/discussion/DiscussionDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RequireAuth from './components/auth/RequireAuth';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      {/* 公开路由 */}
      <Route
        path="/login"
        element={!token ? <LoginPage /> : <Navigate to="/" replace />}
      />

      {/* 受保护路由 */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CourseListPage />} />
        <Route path="courses/create" element={<CreateCoursePage />} />
        <Route path="courses/my" element={<MyCoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="discussions/:id" element={<DiscussionDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin/users"
          element={
            <RequireAuth role="admin">
              <UserManagementPage />
            </RequireAuth>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
