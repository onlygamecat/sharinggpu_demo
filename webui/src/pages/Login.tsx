import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  EyeOff, 
  Phone, 
  Lock, 
  User, 
  Shield, 
  MessageSquare,
  UserPlus,
  KeyRound,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { activityApi } from '@/db/api';

interface LoginForm {
  username: string;
  password: string;
  phone: string;
  smsCode: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [loginMethod, setLoginMethod] = useState<'password' | 'sms'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: '',
    password: '',
    phone: '',
    smsCode: '',
    rememberMe: false
  });

  // 倒计时效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [smsCountdown]);

  // 记录用户登录活动
  const recordLoginActivity = async (userId: string, userInfo: {
    username: string;
    phone: string;
    role: string;
    loginMethod: string;
  }) => {
    try {
      await activityApi.recordLoginActivity(userId, {
        username: userInfo.username,
        phone: userInfo.phone,
        role: userInfo.role,
        loginMethod: userInfo.loginMethod,
        ipAddress: '', // 在实际应用中可以获取真实IP
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('记录登录活动失败:', error);
      // 不影响登录流程，只是记录失败
    }
  };

  // 验证手机号格式
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 发送验证码
  const handleSendSms = () => {
    if (!validatePhone(loginForm.phone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    
    setSmsCountdown(60);
    toast.success('验证码已发送，请查收短信');
  };

  // 处理登录
  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      // 密码登录的测试逻辑
      if (loginMethod === 'password') {
        if (!loginForm.username || !loginForm.password) {
          toast.error('请输入用户名和密码');
          return;
        }

        if (loginForm.password.length < 6) {
          toast.error('密码长度不能少于6位');
          return;
        }

        // 测试账号验证
        const testAccounts = [
          { username: 'admin', password: '123456', role: 'admin', phone: '13800138000' },
          { username: 'test', password: '123456', role: 'user', phone: '13800138001' },
          { username: '13800138000', password: '123456', role: 'admin', phone: '13800138000' },
          { username: '13800138001', password: '123456', role: 'user', phone: '13800138001' }
        ];

        const account = testAccounts.find(acc => 
          acc.username === loginForm.username && acc.password === loginForm.password
        );

        if (!account) {
          toast.error('用户名或密码错误');
          return;
        }

        toast.success('登录成功！');
        
        // 保存记住登录状态
        if (loginForm.rememberMe) {
          const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30天
          localStorage.setItem('loginInfo', JSON.stringify({
            username: loginForm.username,
            rememberMe: true,
            expiry
          }));
        }

        // 模拟用户登录状态
        const demoUser = {
          id: account.role === 'admin' ? 'admin-001' : 'user-001',
          phone: account.phone,
          role: account.role,
          username: account.username
        };
        
        localStorage.setItem('demo_user', JSON.stringify(demoUser));

        // 记录登录活动
        await recordLoginActivity(demoUser.id, {
          username: account.username,
          phone: account.phone,
          role: account.role,
          loginMethod: 'password'
        });
        
        // 等待一下让用户看到成功消息，然后跳转
        setTimeout(() => {
          navigate('/');
        }, 1000);
        
        return;
      }
      
      // 短信验证码登录的测试逻辑
      if (loginMethod === "sms") {
        if (!validatePhone(loginForm.phone) || loginForm.smsCode !== "123456") {
          toast.error("手机号或验证码错误");
          return;
        }
        toast.success('登录成功！');
        
        // 保存记住登录状态
        if (loginForm.rememberMe) {
          const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30天
          localStorage.setItem('loginInfo', JSON.stringify({
            username: loginForm.phone,
            rememberMe: true,
            expiry
          }));
        }

        // 模拟用户登录状态
        const demoUser = {
          id: 'user-sms-001',
          phone: loginForm.phone,
          role: 'user',
          username: loginForm.phone
        };
        
        localStorage.setItem('demo_user', JSON.stringify(demoUser));

        // 记录登录活动
        await recordLoginActivity(demoUser.id, {
          username: loginForm.phone,
          phone: loginForm.phone,
          role: 'user',
          loginMethod: 'sms'
        });

        setTimeout(() => {
          navigate('/');
        }, 1000);
        
        return;
      }
      
      // 如果都不匹配，显示错误
      if (loginMethod === 'password') {
        toast.error('用户名或密码错误');
      } else {
        toast.error('手机号或验证码错误');
      }
    } catch (error) {
      console.error('登录失败:', error);
      toast.error('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册
  const handleRegister = () => {
    toast.info('注册功能开发中...');
  };

  // 处理忘记密码
  const handleForgotPassword = () => {
    toast.info('密码重置功能开发中...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <img
              src="https://miaoda-site-img.cdn.bcebos.com/placeholder/code_logo_default.png"
              alt="Logo"
              className="h-8 w-8"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            联想算力共享平台
          </CardTitle>
          <CardDescription className="text-gray-600">
            登录以访问您的算力资源
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 用户角色选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">选择用户类型</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={userRole === 'user' ? 'default' : 'outline'}
                className={`h-12 flex items-center justify-center space-x-2 ${
                  userRole === 'user' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => setUserRole('user')}
              >
                <User className="h-4 w-4" />
                <span>普通用户</span>
              </Button>
              <Button
                type="button"
                variant={userRole === 'admin' ? 'default' : 'outline'}
                className={`h-12 flex items-center justify-center space-x-2 ${
                  userRole === 'admin' 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' 
                    : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}
                onClick={() => setUserRole('admin')}
              >
                <Shield className="h-4 w-4" />
                <span>管理员</span>
              </Button>
            </div>
          </div>

          {/* 登录方式选择 - 仅普通用户显示 */}
          {userRole === 'user' && (
            <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as 'password' | 'sms')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>密码登录</span>
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>短信登录</span>
                </TabsTrigger>
              </TabsList>

              {/* 密码登录 */}
              <TabsContent value="password" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名/手机号</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名或手机号"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 短信登录 */}
              <TabsContent value="sms" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入手机号"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smsCode">验证码</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="smsCode"
                      type="text"
                      placeholder="请输入6位验证码"
                      value={loginForm.smsCode}
                      onChange={(e) => setLoginForm({...loginForm, smsCode: e.target.value})}
                      className="h-11 flex-1"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendSms}
                      disabled={smsCountdown > 0 || !validatePhone(loginForm.phone)}
                      className="h-11 px-4 whitespace-nowrap"
                    >
                      {smsCountdown > 0 ? `${smsCountdown}s` : '发送验证码'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* 管理员密码登录 */}
          {userRole === 'admin' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">管理员账号</Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="请输入管理员账号"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">管理员密码</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入管理员密码"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 记住登录 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={loginForm.rememberMe}
              onCheckedChange={(checked) => setLoginForm({...loginForm, rememberMe: !!checked})}
            />
            <Label htmlFor="remember" className="text-sm text-gray-600">
              一个月内免登录
            </Label>
          </div>

          {/* 登录按钮 */}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isLoading ? '登录中...' : '登录'}
          </Button>

          {/* 测试账号信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-blue-800 flex items-center">
              <Smartphone className="h-4 w-4 mr-2" />
              测试账号
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>管理员:</strong> admin / 123456</div>
              <div><strong>普通用户:</strong> test / 123456</div>
              <div><strong>手机登录:</strong> 13800138000 / 验证码: 123456</div>
            </div>
          </div>

          {/* 其他操作 - 仅普通用户显示 */}
          {userRole === 'user' && (
            <>
              <Separator />
              
              <div className="flex justify-between text-sm">
                <Button variant="link" onClick={handleRegister} className="p-0 h-auto text-blue-600">
                  <UserPlus className="h-4 w-4 mr-1" />
                  新用户注册
                </Button>
                <Button variant="link" onClick={handleForgotPassword} className="p-0 h-auto text-blue-600">
                  <KeyRound className="h-4 w-4 mr-1" />
                  忘记密码
                </Button>
              </div>

              {/* 第三方登录 */}
              <div className="space-y-3">
                <div className="relative">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-xs text-gray-500">或使用第三方登录</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" className="h-10" onClick={() => toast.info('微信登录开发中...')}>
                    <span className="text-green-600">微信</span>
                  </Button>
                  <Button variant="outline" className="h-10" onClick={() => toast.info('QQ登录开发中...')}>
                    <span className="text-blue-600">QQ</span>
                  </Button>
                  <Button variant="outline" className="h-10" onClick={() => toast.info('微博登录开发中...')}>
                    <span className="text-red-600">微博</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;