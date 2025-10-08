import { activityApi } from '@/db/api';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'miaoda-auth-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Eye, 
  EyeOff, 
  User, 
  Shield, 
  Phone, 
  Lock, 
  MessageSquare, 
  UserPlus, 
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'user' | 'admin';
type LoginMethod = 'password' | 'sms';

interface LoginFormData {
  username: string;
  password: string;
  phone: string;
  smsCode: string;
  rememberMe: boolean;
}

interface RegisterFormData {
  phone: string;
  smsCode: string;
  username: string;
  confirmPassword: string;
}

interface ForgotPasswordData {
  phone: string;
  smsCode: string;
  newPassword: string;
  confirmPassword: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 状态管理
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  
  // 表单数据
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    username: '',
    password: '',
    phone: '',
    smsCode: '',
    rememberMe: false
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    phone: '',
    smsCode: '',
    username: '',
    confirmPassword: ''
  });
  
  const [forgotForm, setForgotForm] = useState<ForgotPasswordData>({
    phone: '',
    smsCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 验证状态
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 模态框状态
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // 检查用户是否已登录
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // 短信验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (smsCountdown > 0) {
      timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [smsCountdown]);

  // 检查记住登录状态
  useEffect(() => {
    const savedLoginInfo = localStorage.getItem('loginInfo');
    if (savedLoginInfo) {
      const { username, rememberMe, expiry } = JSON.parse(savedLoginInfo);
      if (rememberMe && new Date().getTime() < expiry) {
        setLoginForm(prev => ({ ...prev, username, rememberMe: true }));
      } else {
        localStorage.removeItem('loginInfo');
      }
    }
  }, []);

  // 表单验证函数
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateSmsCode = (code: string): boolean => {
    return code.length === 6 && /^\d{6}$/.test(code);
  };

  // 实时验证
  const validateField = (field: string, value: string, form: 'login' | 'register' | 'forgot') => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'phone':
        if (value && !validatePhone(value)) {
          newErrors[`${form}_phone`] = '请输入正确的手机号格式';
        } else {
          delete newErrors[`${form}_phone`];
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          newErrors[`${form}_password`] = '密码长度至少6位';
        } else {
          delete newErrors[`${form}_password`];
        }
        break;
      case 'smsCode':
        if (value && !validateSmsCode(value)) {
          newErrors[`${form}_smsCode`] = '请输入6位数字验证码';
        } else {
          delete newErrors[`${form}_smsCode`];
        }
        break;
      case 'username':
        if (value && value.length < 2) {
          newErrors[`${form}_username`] = '用户名至少2个字符';
        } else {
          delete newErrors[`${form}_username`];
        }
        break;
      case 'confirmPassword':
        const originalPassword = form === 'register' ? registerForm.confirmPassword : forgotForm.newPassword;
        if (value && value !== originalPassword) {
          newErrors[`${form}_confirmPassword`] = '两次密码输入不一致';
        } else {
          delete newErrors[`${form}_confirmPassword`];
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // 发送短信验证码
  const sendSmsCode = async (phone: string, type: 'login' | 'register' | 'forgot') => {
    if (!validatePhone(phone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    
    if (smsCountdown > 0) {
      return;
    }
    
    try {
      setIsLoading(true);
      // 这里应该调用实际的短信发送API
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      setSmsCountdown(60);
      toast.success('验证码已发送');
    } catch (error) {
      toast.error('验证码发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 登录处理 - 集成真实的认证系统
  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      // 验证表单
      if (loginMethod === 'password') {
        if (!loginForm.username || !loginForm.password) {
          toast.error('请填写完整的登录信息');
          return;
        }
        if (!validatePassword(loginForm.password)) {
          toast.error('密码格式不正确');
          return;
        }
      } else {
        if (!loginForm.phone || !loginForm.smsCode) {
          toast.error('请填写完整的登录信息');
          return;
        }
        if (!validatePhone(loginForm.phone) || !validateSmsCode(loginForm.smsCode)) {
          toast.error('手机号或验证码格式不正确');
          return;
        }
      }
      
      // 测试用户快速登录（用于演示）
      if (loginMethod === 'password' && 
          (loginForm.username === 'admin' || loginForm.username === 'test' || loginForm.username === '13800138000') && 
          loginForm.password === '123456') {
        
        // 模拟成功登录
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
        localStorage.setItem('demo_user', JSON.stringify({
          id: loginForm.username === 'admin' ? 'admin-001' : 'user-001',
          phone: loginForm.username === '13800138000' ? loginForm.username : '13800138000',
          role: loginForm.username === 'admin' ? 'admin' : 'user',
          username: loginForm.username
        }));
        
        // 等待一下让用户看到成功消息，然后跳转
        setTimeout(() => {
          navigate('/');
          // 刷新页面以更新认证状态
          
        }, 1000);
        
        return;
      }
      
      // 短信验证码登录的测试逻辑
      if (loginMethod === 'sms' && validatePhone(loginForm.phone) && loginForm.smsCode === '123456') {
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
        localStorage.setItem('demo_user', JSON.stringify({
          id: 'user-sms-001',
          phone: loginForm.phone,
          role: 'user',
          username: loginForm.phone
        }));
        
        setTimeout(() => {
          navigate('/');
          
        }, 1000);
        
        return;
      }
      
      // 如果不是测试用户，尝试真实的 Supabase 认证
      let authResult;
      
      if (loginMethod === 'password') {
        // 密码登录
        if (validatePhone(loginForm.username)) {
          // 手机号登录
          authResult = await supabase.auth.signInWithPassword({
            phone: loginForm.username,
            password: loginForm.password,
          });
        } else {
          // 用户名登录 - 需要先通过用户名查找手机号
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('username', loginForm.username)
            .single();
          
          if (!profile) {
            toast.error('用户不存在，请使用测试账号：admin/123456 或 test/123456');
            return;
          }
          
          authResult = await supabase.auth.signInWithPassword({
            phone: profile.phone,
            password: loginForm.password,
          });
        }
      } else {
        // 短信验证码登录
        authResult = await supabase.auth.verifyOtp({
          phone: loginForm.phone,
          token: loginForm.smsCode,
          type: 'sms'
        });
      }
      
      if (authResult.error) {
        if (authResult.error.message.includes('Invalid login credentials')) {
          toast.error('用户名或密码错误，请使用测试账号：admin/123456 或 test/123456');
        } else if (authResult.error.message.includes('Invalid token')) {
          toast.error('验证码错误或已过期，测试验证码：123456');
        } else {
          toast.error('登录失败，请使用测试账号：admin/123456 或 test/123456');
        }
        return;
      }
      
      // 保存记住登录状态
      if (loginForm.rememberMe) {
        const expiry = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30天
        localStorage.setItem('loginInfo', JSON.stringify({
          username: loginForm.username || loginForm.phone,
          rememberMe: true,
          expiry
        }));
      }
      
      toast.success('登录成功！');
      
      // 等待一下让用户看到成功消息，然后跳转
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('登录失败，请使用测试账号：admin/123456 或 test/123456');
    } finally {
      setIsLoading(false);
    }
  };

  // 注册处理 - 集成真实的认证系统
  const handleRegister = async () => {
    setIsLoading(true);
    
    try {
      // 验证表单
      if (!registerForm.phone || !registerForm.smsCode || !registerForm.username) {
        toast.error('请填写完整的注册信息');
        return;
      }
      
      if (!validatePhone(registerForm.phone)) {
        toast.error('手机号格式不正确');
        return;
      }
      
      if (!validateSmsCode(registerForm.smsCode)) {
        toast.error('验证码格式不正确');
        return;
      }
      
      // 使用 Supabase 注册
      const { data, error } = await supabase.auth.verifyOtp({
        phone: registerForm.phone,
        token: registerForm.smsCode,
        type: 'sms'
      });
      
      if (error) {
        toast.error('注册失败：' + error.message);
        return;
      }
      
      // 注册成功后，更新用户档案
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            username: registerForm.username,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user.id);
        
        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }
      
      toast.success('注册成功！请使用手机号和初始密码123456登录');
      setShowRegister(false);
      
      // 自动填充登录表单
      setLoginForm(prev => ({
        ...prev,
        username: registerForm.phone,
        password: '123456'
      }));
      setLoginMethod('password');
      
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error('注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 忘记密码处理
  const handleForgotPassword = async () => {
    setIsLoading(true);
    
    try {
      // 验证表单
      if (!forgotForm.phone || !forgotForm.smsCode || !forgotForm.newPassword || !forgotForm.confirmPassword) {
        toast.error('请填写完整的重置信息');
        return;
      }
      
      if (!validatePhone(forgotForm.phone)) {
        toast.error('手机号格式不正确');
        return;
      }
      
      if (!validateSmsCode(forgotForm.smsCode)) {
        toast.error('验证码格式不正确');
        return;
      }
      
      if (!validatePassword(forgotForm.newPassword)) {
        toast.error('新密码长度至少6位');
        return;
      }
      
      if (forgotForm.newPassword !== forgotForm.confirmPassword) {
        toast.error('两次密码输入不一致');
        return;
      }
      
      // 验证短信验证码
      const { data, error } = await supabase.auth.verifyOtp({
        phone: forgotForm.phone,
        token: forgotForm.smsCode,
        type: 'sms'
      });
      
      if (error) {
        toast.error('验证码错误：' + error.message);
        return;
      }
      
      // 更新密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: forgotForm.newPassword
      });
      
      if (updateError) {
        toast.error('密码重置失败：' + updateError.message);
        return;
      }
      
      toast.success('密码重置成功！');
      setShowForgotPassword(false);
      
      // 自动填充登录表单
      setLoginForm(prev => ({
        ...prev,
        username: forgotForm.phone,
        password: forgotForm.newPassword
      }));
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('密码重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 第三方登录
  const handleThirdPartyLogin = (provider: 'wechat' | 'qq' | 'weibo') => {
    toast.info(`${provider === 'wechat' ? '微信' : provider === 'qq' ? 'QQ' : '微博'}登录功能开发中`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              联想算力共享平台
            </CardTitle>
            <CardDescription className="text-gray-600">
              {userRole === 'admin' ? '管理员登录' : '智能算力资源调度服务'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 用户角色切换 */}
            <div className="flex space-x-2">
              <Button
                variant={userRole === 'user' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUserRole('user');
                  setLoginMethod('password');
                }}
                className={cn(
                  "flex-1 transition-all duration-200",
                  userRole === 'user' 
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md" 
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                <User className="w-4 h-4 mr-2" />
                普通用户
              </Button>
              <Button
                variant={userRole === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setUserRole('admin');
                  setLoginMethod('password');
                }}
                className={cn(
                  "flex-1 transition-all duration-200",
                  userRole === 'admin' 
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md" 
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                <Shield className="w-4 h-4 mr-2" />
                管理员
              </Button>
            </div>

            {/* 登录方式切换 (仅普通用户) */}
            {userRole === 'user' && (
              <Tabs value={loginMethod} onValueChange={(value) => setLoginMethod(value as LoginMethod)}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                  <TabsTrigger value="password" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <Lock className="w-4 h-4 mr-2" />
                    密码登录
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    短信登录
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* 登录表单 */}
            <div className="space-y-4">
              {loginMethod === 'password' ? (
                <>
                  {/* 用户名/手机号输入 */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      {userRole === 'admin' ? '管理员账号' : '用户名/手机号'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        placeholder={userRole === 'admin' ? '请输入管理员账号' : '请输入用户名或手机号'}
                        value={loginForm.username}
                        onChange={(e) => {
                          setLoginForm(prev => ({ ...prev, username: e.target.value }));
                          validateField('username', e.target.value, 'login');
                        }}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <User className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                    </div>
                    {errors.login_username && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.login_username}
                      </p>
                    )}
                  </div>

                  {/* 密码输入 */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      密码
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入密码"
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm(prev => ({ ...prev, password: e.target.value }));
                          validateField('password', e.target.value, 'login');
                        }}
                        className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Lock className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1 h-10 w-10 p-0 hover:bg-gray-100"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.login_password && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.login_password}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* 手机号输入 */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      手机号
                    </Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="请输入手机号"
                        value={loginForm.phone}
                        onChange={(e) => {
                          setLoginForm(prev => ({ ...prev, phone: e.target.value }));
                          validateField('phone', e.target.value, 'login');
                        }}
                        className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Phone className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                    </div>
                    {errors.login_phone && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.login_phone}
                      </p>
                    )}
                  </div>

                  {/* 验证码输入 */}
                  <div className="space-y-2">
                    <Label htmlFor="smsCode" className="text-sm font-medium text-gray-700">
                      验证码
                    </Label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          id="smsCode"
                          type="text"
                          placeholder="请输入6位验证码"
                          value={loginForm.smsCode}
                          onChange={(e) => {
                            setLoginForm(prev => ({ ...prev, smsCode: e.target.value }));
                            validateField('smsCode', e.target.value, 'login');
                          }}
                          className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          maxLength={6}
                        />
                        <MessageSquare className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => sendSmsCode(loginForm.phone, 'login')}
                        disabled={smsCountdown > 0 || !validatePhone(loginForm.phone)}
                        className="h-12 px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      >
                        {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                      </Button>
                    </div>
                    {errors.login_smsCode && (
                      <p className="text-sm text-red-500 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.login_smsCode}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* 记住登录 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={loginForm.rememberMe}
                    onCheckedChange={(checked) => 
                      setLoginForm(prev => ({ ...prev, rememberMe: checked as boolean }))
                    }
                    className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                    一个月内免登录
                  </Label>
                </div>
                
                {/* 忘记密码 */}
                <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm text-blue-500 hover:text-blue-600 p-0 h-auto">
                      忘记密码？
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <RotateCcw className="w-5 h-5 mr-2 text-blue-500" />
                        重置密码
                      </DialogTitle>
                      <DialogDescription>
                        通过手机号验证码重置您的密码
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* 手机号 */}
                      <div className="space-y-2">
                        <Label htmlFor="forgot-phone">手机号</Label>
                        <div className="relative">
                          <Input
                            id="forgot-phone"
                            type="tel"
                            placeholder="请输入手机号"
                            value={forgotForm.phone}
                            onChange={(e) => {
                              setForgotForm(prev => ({ ...prev, phone: e.target.value }));
                              validateField('phone', e.target.value, 'forgot');
                            }}
                            className="pl-10"
                          />
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        {errors.forgot_phone && (
                          <p className="text-sm text-red-500">{errors.forgot_phone}</p>
                        )}
                      </div>

                      {/* 验证码 */}
                      <div className="space-y-2">
                        <Label htmlFor="forgot-sms">验证码</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="forgot-sms"
                            type="text"
                            placeholder="6位验证码"
                            value={forgotForm.smsCode}
                            onChange={(e) => {
                              setForgotForm(prev => ({ ...prev, smsCode: e.target.value }));
                              validateField('smsCode', e.target.value, 'forgot');
                            }}
                            maxLength={6}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => sendSmsCode(forgotForm.phone, 'forgot')}
                            disabled={smsCountdown > 0 || !validatePhone(forgotForm.phone)}
                          >
                            {smsCountdown > 0 ? `${smsCountdown}s` : '获取'}
                          </Button>
                        </div>
                        {errors.forgot_smsCode && (
                          <p className="text-sm text-red-500">{errors.forgot_smsCode}</p>
                        )}
                      </div>

                      {/* 新密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="forgot-password">新密码</Label>
                        <Input
                          id="forgot-password"
                          type="password"
                          placeholder="请输入新密码（至少6位）"
                          value={forgotForm.newPassword}
                          onChange={(e) => {
                            setForgotForm(prev => ({ ...prev, newPassword: e.target.value }));
                            validateField('password', e.target.value, 'forgot');
                          }}
                        />
                        {errors.forgot_password && (
                          <p className="text-sm text-red-500">{errors.forgot_password}</p>
                        )}
                      </div>

                      {/* 确认密码 */}
                      <div className="space-y-2">
                        <Label htmlFor="forgot-confirm">确认密码</Label>
                        <Input
                          id="forgot-confirm"
                          type="password"
                          placeholder="请再次输入新密码"
                          value={forgotForm.confirmPassword}
                          onChange={(e) => {
                            setForgotForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                            validateField('confirmPassword', e.target.value, 'forgot');
                          }}
                        />
                        {errors.forgot_confirmPassword && (
                          <p className="text-sm text-red-500">{errors.forgot_confirmPassword}</p>
                        )}
                      </div>

                      <Button 
                        onClick={handleForgotPassword} 
                        disabled={isLoading}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            重置中...
                          </>
                        ) : (
                          '重置密码'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 登录按钮 */}
              <Button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    立即登录
                  </>
                )}
              </Button>

              {/* 注册按钮 (仅普通用户) */}
              {userRole === 'user' && (
                <Dialog open={showRegister} onOpenChange={setShowRegister}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-12 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300">
                      <UserPlus className="w-5 h-5 mr-2" />
                      新用户注册
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
                        用户注册
                      </DialogTitle>
                      <DialogDescription>
                        创建您的算力共享平台账号
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* 手机号 */}
                      <div className="space-y-2">
                        <Label htmlFor="register-phone">手机号</Label>
                        <div className="relative">
                          <Input
                            id="register-phone"
                            type="tel"
                            placeholder="请输入手机号"
                            value={registerForm.phone}
                            onChange={(e) => {
                              setRegisterForm(prev => ({ ...prev, phone: e.target.value }));
                              validateField('phone', e.target.value, 'register');
                            }}
                            className="pl-10"
                          />
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        </div>
                        {errors.register_phone && (
                          <p className="text-sm text-red-500">{errors.register_phone}</p>
                        )}
                      </div>

                      {/* 验证码 */}
                      <div className="space-y-2">
                        <Label htmlFor="register-sms">验证码</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="register-sms"
                            type="text"
                            placeholder="6位验证码"
                            value={registerForm.smsCode}
                            onChange={(e) => {
                              setRegisterForm(prev => ({ ...prev, smsCode: e.target.value }));
                              validateField('smsCode', e.target.value, 'register');
                            }}
                            maxLength={6}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => sendSmsCode(registerForm.phone, 'register')}
                            disabled={smsCountdown > 0 || !validatePhone(registerForm.phone)}
                          >
                            {smsCountdown > 0 ? `${smsCountdown}s` : '获取'}
                          </Button>
                        </div>
                        {errors.register_smsCode && (
                          <p className="text-sm text-red-500">{errors.register_smsCode}</p>
                        )}
                      </div>

                      {/* 用户名 */}
                      <div className="space-y-2">
                        <Label htmlFor="register-username">用户名</Label>
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="请输入用户名"
                          value={registerForm.username}
                          onChange={(e) => {
                            setRegisterForm(prev => ({ ...prev, username: e.target.value }));
                            validateField('username', e.target.value, 'register');
                          }}
                        />
                        {errors.register_username && (
                          <p className="text-sm text-red-500">{errors.register_username}</p>
                        )}
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-600 flex items-center">
                          <Smartphone className="w-4 h-4 mr-2" />
                          注册成功后，初始密码为：123456
                        </p>
                      </div>

                      <Button 
                        onClick={handleRegister} 
                        disabled={isLoading}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            注册中...
                          </>
                        ) : (
                          '立即注册'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* 第三方登录 (仅普通用户) */}
              {userRole === 'user' && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">或使用第三方登录</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThirdPartyLogin('wechat')}
                      className="h-10 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .659-.52 1.188-1.162 1.188-.642 0-1.162-.529-1.162-1.188 0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.248 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.062-6.122zm-3.12 4.069c.765 0 1.383.638 1.383 1.426s-.618 1.426-1.383 1.426-1.383-.638-1.383-1.426.618-1.426 1.383-1.426zm4.715 0c.765 0 1.383.638 1.383 1.426s-.618 1.426-1.383 1.426-1.383-.638-1.383-1.426.618-1.426 1.383-1.426z"/>
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThirdPartyLogin('qq')}
                      className="h-10 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.175 1.219-5.175s-.31-.653-.31-1.518c0-1.422.824-2.482 1.851-2.482.873 0 1.295.653 1.295 1.436 0 .873-.653 2.184-.992 3.396-.282 1.199.653 2.184 1.851 2.184 2.223 0 3.930-2.343 3.930-5.721 0-2.992-2.15-5.08-5.221-5.08-3.555 0-5.641 2.664-5.641 5.421 0 1.073.414 2.22.932 2.840.102.12.117.226.086.35-.094.397-.301 1.199-.343 1.365-.055.218-.179.265-.414.159-1.518-.706-2.466-2.924-2.466-4.704 0-3.930 2.85-7.539 8.244-7.539 4.323 0 7.688 3.075 7.688 7.188 0 4.287-2.703 7.734-6.455 7.734-1.259 0-2.466-.653-2.875-1.436 0 0-.629 2.393-.781 2.984-.282 1.085-1.043 2.455-1.558 3.285C9.584 23.815 10.77 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleThirdPartyLogin('weibo')}
                      className="h-10 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zm8.717-8.922c-.332-.066-.562-.132-.389-.475.375-.751.413-1.402.111-1.87-.564-.877-2.111-.83-4.11-.022 0 0-.628.26-.467-.214.308-1.066.26-1.957-.165-2.473-.972-1.178-3.556.045-5.771 2.734 0 0-1.106 1.34-2.061 2.705-.956 1.365-1.675 2.563-1.675 3.762 0 4.513 5.794 7.279 11.459 7.279 7.457 0 12.43-5.461 12.43-9.804 0-2.621-2.207-4.106-6.362-3.622zM7.45 18.33c-1.593.16-2.968-.611-3.071-1.727-.103-1.116 1.089-2.146 2.682-2.305 1.593-.159 2.968.611 3.071 1.727.103 1.116-1.089 2.146-2.682 2.305zm2.978-3.582c-.553.301-1.267.24-1.592-.137-.325-.377-.177-.925.376-1.226.553-.301 1.267-.24 1.592.137.325.377.177.925-.376 1.226zm8.236-5.59c.183-.115.34-.26.467-.433.254-.346.394-.753.394-1.18 0-.427-.14-.834-.394-1.18-.127-.173-.284-.318-.467-.433-.366-.23-.8-.354-1.244-.354s-.878.124-1.244.354c-.183.115-.34.26-.467.433-.254.346-.394.753-.394 1.18 0 .427.14.834.394 1.18.127.173.284.318.467.433.366.23.8.354 1.244.354s.878-.124 1.244-.354z"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 底部提示 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-700 font-medium mb-2">🔧 测试账号</p>
            <div className="text-blue-600 text-xs space-y-1">
              <p>管理员：admin / 123456</p>
              <p>普通用户：test / 123456</p>

              <p>短信验证码：123456（任意手机号）</p>
            </div>
          </div>
          <p>© 2025 联想算力共享平台</p>
          <p className="mt-1">智能算力资源调度 · 安全可靠</p>
        </div>
      </div>
    </div>
  );
};

export default Login;