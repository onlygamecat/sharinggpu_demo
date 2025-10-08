import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from 'miaoda-auth-react';

interface DemoUser {
  id: string;
  phone: string;
  role: string;
  username: string;
}

const TestLogin: React.FC = () => {
  const { user, logout } = useAuth();
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  // 检查演示用户登录状态
  useEffect(() => {
    const checkDemoUser = () => {
      const demoUserData = localStorage.getItem('demo_user');
      if (demoUserData) {
        try {
          setDemoUser(JSON.parse(demoUserData));
        } catch (error) {
          console.error('Error parsing demo user data:', error);
          localStorage.removeItem('demo_user');
        }
      } else {
        setDemoUser(null);
      }
    };

    checkDemoUser();
    
    // 监听 storage 事件
    window.addEventListener('storage', checkDemoUser);
    
    return () => {
      window.removeEventListener('storage', checkDemoUser);
    };
  }, []);

  const handleLogout = () => {
    if (demoUser) {
      localStorage.removeItem('demo_user');
      localStorage.removeItem('loginInfo');
      setDemoUser(null);
    } else {
      logout();
    }
  };

  // 获取当前用户信息（优先使用演示用户）
  const currentUser = demoUser || user;
  const isLoggedIn = !!currentUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">登录状态测试</h1>
          <p className="text-xl text-gray-600">验证用户登录和权限管理功能</p>
        </div>

        {/* 登录状态卡片 */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              {isLoggedIn ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <User className="h-8 w-8 text-gray-600" />
              )}
            </div>
            <CardTitle className={isLoggedIn ? "text-green-600" : "text-gray-600"}>
              {isLoggedIn ? "已登录" : "未登录"}
            </CardTitle>
            <CardDescription>
              {isLoggedIn ? "用户已成功登录系统" : "请先登录以访问平台功能"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoggedIn ? (
              <>
                {/* 用户信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">用户信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-700">用户名:</span>
                      <span className="ml-2 text-gray-900">
                        {demoUser ? demoUser.username : user?.phone}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">手机号:</span>
                      <span className="ml-2 text-gray-900">
                        {demoUser ? demoUser.phone : user?.phone}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">用户ID:</span>
                      <span className="ml-2 text-gray-900 font-mono text-sm">
                        {demoUser ? demoUser.id : user?.id}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">角色:</span>
                      <span className="ml-2">
                        {demoUser ? (
                          demoUser.role === 'admin' ? (
                            <Badge variant="destructive">管理员</Badge>
                          ) : (
                            <Badge variant="secondary">普通用户</Badge>
                          )
                        ) : (
                          <Badge variant="secondary">普通用户</Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 权限测试 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">权限测试</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link to="/" className="flex flex-col items-center space-y-2">
                        <User className="h-6 w-6" />
                        <span>访问首页</span>
                        <span className="text-xs text-gray-500">所有用户可访问</span>
                      </Link>
                    </Button>
                    
                    {demoUser?.role === 'admin' && (
                      <Button asChild variant="outline" className="h-auto p-4">
                        <Link to="/admin" className="flex flex-col items-center space-y-2">
                          <Shield className="h-6 w-6" />
                          <span>管理后台</span>
                          <span className="text-xs text-gray-500">仅管理员可访问</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* 登出按钮 */}
                <div className="pt-4 border-t">
                  <Button onClick={handleLogout} variant="destructive" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </Button>
                </div>
              </>
            ) : (
              /* 登录提示 */
              <div className="text-center space-y-4">
                <p className="text-gray-600">请使用以下测试账号登录：</p>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <strong>管理员账号:</strong> admin / 123456
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <strong>普通用户:</strong> test / 123456
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <strong>手机登录:</strong> 13800138000 / 验证码: 123456
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link to="/login">
                    前往登录
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 功能测试链接 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">算力需求</CardTitle>
              <CardDescription>测试算力申请功能</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/demand">访问页面</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">算力供给</CardTitle>
              <CardDescription>测试算力共享功能</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/supply">访问页面</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">资源管理</CardTitle>
              <CardDescription>测试资源查看功能</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/resources">访问页面</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;