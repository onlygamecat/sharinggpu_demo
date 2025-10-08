import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Shield, Settings } from 'lucide-react';
import { useAuth } from 'miaoda-auth-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import routes from '../../routes';

interface DemoUser {
  id: string;
  phone: string;
  role: string;
  username: string;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const navigation = routes.filter(route => route.visible !== false);

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
    
    // 监听 storage 事件，当其他标签页更新 localStorage 时同步状态
    window.addEventListener('storage', checkDemoUser);
    
    return () => {
      window.removeEventListener('storage', checkDemoUser);
    };
  }, []);

  // 获取当前用户信息（优先使用演示用户）
  const currentUser = demoUser || user;
  const isLoggedIn = !!currentUser;

  // 处理退出登录
  const handleLogout = async () => {
    try {
      if (demoUser) {
        // 演示用户退出
        localStorage.removeItem('demo_user');
        localStorage.removeItem('loginInfo');
        setDemoUser(null);
        toast.success('退出登录成功');
      } else {
        // 真实用户退出
        await logout();
        toast.success('退出登录成功');
      }
      
      // 跳转到登录页面
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error('退出登录失败');
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (demoUser) {
      return demoUser.username || demoUser.phone;
    }
    return user?.phone || '用户';
  };

  // 获取用户角色
  const getUserRole = () => {
    if (demoUser) {
      return demoUser.role;
    }
    return 'user'; // 默认为普通用户
  };

  // 获取用户头像字母
  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="https://miaoda-site-img.cdn.bcebos.com/placeholder/code_logo_default.png"
                alt="算力共享平台"
              />
              <span className="ml-2 text-xl font-bold text-blue-600">联想算力共享平台</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-base font-medium rounded-md ${
                  location.pathname === item.path
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                } transition duration-300`}
              >
                {item.name}
              </Link>
            ))}
            
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getUserRole() === 'admin' ? (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                            <Shield className="h-3 w-3 mr-1" />
                            管理员
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            <User className="h-3 w-3 mr-1" />
                            用户
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">
                      {demoUser ? demoUser.phone : user?.phone}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {getUserRole() === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          管理后台
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm">
                  登录
                </Button>
              </Link>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden flex items-center space-x-2">
            {isLoggedIn && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">
                  {getUserDisplayName()}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    location.pathname === item.path
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  } transition duration-300`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {isLoggedIn ? (
                <div className="border-t pt-2 mt-2">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    登录为: {getUserDisplayName()}
                    {getUserRole() === 'admin' && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        管理员
                      </Badge>
                    )}
                  </div>
                  {getUserRole() === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition duration-300"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="inline mr-2 h-4 w-4" />
                      管理后台
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-2 mt-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      登录
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;