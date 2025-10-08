import Home from './pages/Home';
import Login from './pages/Login';
import ComputeDemand from './pages/ComputeDemand';
import ComputeSupply from './pages/ComputeSupply';
import ResourceManagement from './pages/ResourceManagement';
import AdminDashboard from './pages/AdminDashboard';
import TestLogin from './pages/TestLogin';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <Home />
  },
  {
    name: '算力需求',
    path: '/demand',
    element: <ComputeDemand />
  },
  {
    name: '算力供给',
    path: '/supply',
    element: <ComputeSupply />
  },
  {
    name: '资源管理',
    path: '/resources',
    element: <ResourceManagement />
  },
  {
    name: '管理后台',
    path: '/admin',
    element: <AdminDashboard />
  },
  {
    name: '登录',
    path: '/login',
    element: <Login />,
    visible: false
  },
  {
    name: '登录测试',
    path: '/test-login',
    element: <TestLogin />,
    visible: false
  }
];

export default routes;