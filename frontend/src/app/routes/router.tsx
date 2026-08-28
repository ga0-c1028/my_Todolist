import { createBrowserRouter, Navigate } from 'react-router-dom';
import { SignupPage } from '../../pages/signup';
import { LoginPage } from '../../pages/login';
import { TodoListPage } from '../../pages/todo-list';
import { TodoFormPage } from '../../pages/todo-form';
import { CategoryManagePage } from '../../pages/category-manage';
import { ProfilePage } from '../../pages/profile';
import { RequireAuth } from './RequireAuth';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/todos" replace /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/todos',
    element: (
      <RequireAuth>
        <TodoListPage />
      </RequireAuth>
    ),
  },
  {
    path: '/todos/new',
    element: (
      <RequireAuth>
        <TodoFormPage />
      </RequireAuth>
    ),
  },
  {
    path: '/todos/:id/edit',
    element: (
      <RequireAuth>
        <TodoFormPage />
      </RequireAuth>
    ),
  },
  {
    path: '/categories',
    element: (
      <RequireAuth>
        <CategoryManagePage />
      </RequireAuth>
    ),
  },
  {
    path: '/profile',
    element: (
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    ),
  },
  { path: '*', element: <Navigate to="/todos" replace /> },
]);
