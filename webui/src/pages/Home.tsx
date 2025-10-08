import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from 'miaoda-auth-react';
import { 
  Cpu, 
  Share2, 
  Zap, 
  Shield, 
  Clock, 
  Users,
  Server,
  Activity,
  ArrowRight,
  LogIn
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { statsApi } from '@/db/api';
import type { PlatformStats } from '@/types/types';

interface DemoUser {
  id: string;
  phone: string;
  role: string;
  username: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    total_gpus: 0,
    online_gpus: 0,
    pending_requests: 0,
    completed_requests: 0
  });

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

  useEffect(() => {
    const loadStats = async () => {
      try {
        // 如果是演示用户或者API调用失败，使用模拟数据
        if (demoUser) {
          setStats({
            total_users: 156,
            total_gpus: 48,
            online_gpus: 32,
            pending_requests: 8,
            completed_requests: 1247
          });
          return;
        }
        
        const platformStats = await statsApi.getPlatformStats();
        setStats(platformStats);
      } catch (error) {
        console.error('加载统计数据失败:', error);
        // 使用模拟数据
        setStats({
          total_users: 156,
          total_gpus: 48,
          online_gpus: 32,
          pending_requests: 8,
          completed_requests: 1247
        });
      }
    };

    loadStats();
  }, [demoUser]); // 当演示用户状态改变时重新加载数据

  // 获取当前用户信息（优先使用演示用户）
  const currentUser = demoUser || user;
  const isLoggedIn = !!currentUser;

  const features = [
    {
      icon: <Cpu className="h-8 w-8 text-blue-600" />,
      title: '智能算力匹配',
      description: '基于AI算法，快速匹配最合适的GPU资源，提升计算效率'
    },
    {
      icon: <Share2 className="h-8 w-8 text-green-600" />,
      title: '资源共享',
      description: '将闲置GPU资源接入共享池，实现算力资源的最大化利用'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: '快速部署',
      description: '一键启动算力需求，自动完成请求拦截和转发操作'
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: '安全可靠',
      description: '企业级安全保障，确保数据传输和计算过程的安全性'
    },
    {
      icon: <Clock className="h-8 w-8 text-orange-600" />,
      title: '灵活时段',
      description: '支持自定义共享时段，合理安排资源使用时间'
    },
    {
      icon: <Activity className="h-8 w-8 text-red-600" />,
      title: '实时监控',
      description: '7×24小时技术支持，实时监控平台运行状态'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
              联想台式算力共享平台
            </Badge>
            
            {/* 用户状态显示 */}
            {isLoggedIn && (
              <div className="mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  欢迎回来，{demoUser ? demoUser.username : user?.phone}
                  {demoUser && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {demoUser.role === 'admin' ? '管理员' : '用户'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              智能算力共享
              <span className="text-blue-600 block">释放无限可能</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              通过整合局域网内各类台式机计算资源，形成多GPU算力池，实现算力资源的智能匹配与安全共享
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {isLoggedIn ? (
              <>
                <Button asChild size="lg" className="px-8 py-3">
                  <Link to="/demand">
                    <Cpu className="mr-2 h-5 w-5" />
                    申请算力
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-3">
                  <Link to="/supply">
                    <Share2 className="mr-2 h-5 w-5" />
                    共享算力
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="px-8 py-3">
                  <Link to="/login">
                    <LogIn className="mr-2 h-5 w-5" />
                    立即登录
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-3">
                  <Link to="/demand">
                    <Cpu className="mr-2 h-5 w-5" />
                    了解更多
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
              <div className="text-sm text-gray-600">注册用户</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.total_gpus}</div>
              <div className="text-sm text-gray-600">GPU总数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.online_gpus}</div>
              <div className="text-sm text-gray-600">在线GPU</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.pending_requests}</div>
              <div className="text-sm text-gray-600">待处理请求</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.completed_requests}</div>
              <div className="text-sm text-gray-600">已完成任务</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              平台核心功能
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              为算力需求方和供给方提供完整的解决方案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              用户角色
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              支持多种用户类型，满足不同需求场景
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 算力需求方 */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-600">算力需求方</CardTitle>
                <CardDescription>
                  需要使用GPU算力资源的用户
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>一键申请算力资源</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>智能匹配最优GPU</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>自动请求拦截转发</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span>本地GPU操作体验</span>
                  </div>
                </div>
                <Button asChild className="w-full mt-6">
                  <Link to={isLoggedIn ? "/demand" : "/login"}>
                    {isLoggedIn ? "开始使用" : "登录使用"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* 算力供给方 */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <Server className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">算力供给方</CardTitle>
                <CardDescription>
                  拥有闲置GPU资源的用户
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>共享闲置GPU资源</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>自定义共享时段</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>灵活控制开关</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>资源使用监控</span>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-6">
                  <Link to={isLoggedIn ? "/supply" : "/login"}>
                    {isLoggedIn ? "开始共享" : "登录共享"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            立即开始使用算力共享平台
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            加入我们的算力共享网络，体验高效、安全、智能的计算资源分配
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="px-8 py-3">
              <Link to={isLoggedIn ? "/resources" : "/login"}>
                <Activity className="mr-2 h-5 w-5" />
                {isLoggedIn ? "查看资源" : "登录查看"}
              </Link>
            </Button>
            {(isLoggedIn && demoUser?.role === 'admin') && (
              <Button asChild size="lg" variant="outline" className="px-8 py-3 text-white border-white hover:bg-white hover:text-blue-600">
                <Link to="/admin">
                  <Shield className="mr-2 h-5 w-5" />
                  管理后台
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;