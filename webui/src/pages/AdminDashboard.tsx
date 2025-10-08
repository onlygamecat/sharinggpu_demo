import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  Server, 
  Activity, 
  Settings, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from 'miaoda-auth-react';
import { toast } from 'sonner';
import { profileApi, gpuApi, requestApi, statsApi, activityApi } from "@/db/api";
import type { Profile, GpuResource, ComputeRequest, UserActivity, PlatformStats } from '@/types/types';

interface DemoUser {
  id: string;
  phone: string;
  role: string;
  username: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    total_gpus: 0,
    online_gpus: 0,
    pending_requests: 0,
    completed_requests: 0
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [gpus, setGpus] = useState<GpuResource[]>([]);
  const [requests, setRequests] = useState<ComputeRequest[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    loadData();
  }, [demoUser]); // 当演示用户状态改变时重新加载数据

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 如果是演示用户，使用基于当前用户的模拟数据
      if (demoUser) {
        // 模拟数据
        setStats({
          total_users: 156,
          total_gpus: 48,
          online_gpus: 32,
          pending_requests: 8,
          completed_requests: 1247
        });
        
        // 基于当前登录用户生成相关的模拟数据
        const currentUserData = {
          id: demoUser.id,
          user_id: demoUser.id,
          phone: demoUser.phone,
          username: demoUser.username,
          role: demoUser.role as 'user' | 'admin',
          user_type: 'both' as const,
          created_at: new Date().toISOString()
        };
        
        // 模拟用户数据 - 包含当前登录用户
        const mockUsers = [
          currentUserData,
          {
            id: 'user-002',
            user_id: 'user-002',
            phone: '13800138001',
            username: 'test',
            role: 'user' as const,
            user_type: 'demander' as const,
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'user-003',
            user_id: 'user-003',
            phone: '13800138002',
            username: '张三',
            role: 'user' as const,
            user_type: 'supplier' as const,
            created_at: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: 'user-004',
            user_id: 'user-004',
            phone: '13800138003',
            username: '李四',
            role: 'user' as const,
            user_type: 'both' as const,
            created_at: new Date(Date.now() - 259200000).toISOString()
          }
        ];
        
        setUsers(mockUsers);
        
        // 模拟GPU数据 - 包含当前用户的GPU
        const mockGpus = [
          {
            id: 'gpu-001',
            owner_id: demoUser.id, // 当前用户拥有的GPU
            gpu_name: 'NVIDIA RTX 4090',
            gpu_memory: 24,
            compute_capability: '8.9',
            performance_score: 95,
            status: 'online' as const,
            is_shared: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'gpu-002',
            owner_id: 'user-002',
            gpu_name: 'NVIDIA RTX 3080',
            gpu_memory: 10,
            compute_capability: '8.6',
            performance_score: 85,
            status: 'busy' as const,
            is_shared: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'gpu-003',
            owner_id: 'user-003',
            gpu_name: 'NVIDIA RTX 3070',
            gpu_memory: 8,
            compute_capability: '8.6',
            performance_score: 75,
            status: 'offline' as const,
            is_shared: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setGpus(mockGpus);
        
        // 模拟请求数据 - 包含当前用户的请求
        const mockRequests = [
          {
            id: 'req-001',
            requester_id: demoUser.id, // 当前用户的请求
            assigned_gpu_id: 'gpu-002',
            task_description: '深度学习模型训练 - 图像分类',
            required_memory: 16,
            estimated_duration: 120,
            priority: 'high' as const,
            status: 'running' as const,
            created_at: new Date().toISOString(),
            started_at: new Date().toISOString()
          },
          {
            id: 'req-002',
            requester_id: 'user-002',
            task_description: '图像处理任务',
            required_memory: 8,
            estimated_duration: 60,
            priority: 'normal' as const,
            status: 'pending' as const,
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 'req-003',
            requester_id: 'user-003',
            assigned_gpu_id: 'gpu-001',
            task_description: '科学计算任务',
            required_memory: 12,
            estimated_duration: 90,
            priority: 'low' as const,
            status: 'completed' as const,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            started_at: new Date(Date.now() - 7200000).toISOString(),
            completed_at: new Date(Date.now() - 1800000).toISOString()
          }
        ];
        
        setRequests(mockRequests);
        
        // 模拟活动记录数据 - 包含当前用户的活动
        const mockActivities = [
          {
            id: "activity-001",
            user_id: demoUser.id,
            activity_type: "login",
            activity_data: {
              username: demoUser.username,
              phone: demoUser.phone,
              role: demoUser.role,
              login_method: "password",
              ip_address: "192.168.1.100",
              user_agent: navigator.userAgent,
              timestamp: new Date().toISOString()
            },
            created_at: new Date().toISOString()
          },
          {
            id: "activity-002",
            user_id: "user-002",
            activity_type: "login",
            activity_data: {
              username: "test",
              phone: "13800138001",
              role: "user",
              login_method: "sms",
              ip_address: "192.168.1.101",
              user_agent: "Mozilla/5.0",
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "activity-003",
            user_id: demoUser.id,
            activity_type: "gpu_share",
            activity_data: {
              gpu_name: "NVIDIA RTX 4090",
              action: "enable_sharing",
              timestamp: new Date(Date.now() - 1800000).toISOString()
            },
            created_at: new Date(Date.now() - 1800000).toISOString()
          }
        ];
        
        setActivities(mockActivities);
        
        return;
      }
      
      // 真实用户的数据加载
      const [profile, platformStats, allUsers, allGpus, allRequests, allActivities] = await Promise.all([
        profileApi.getCurrentProfile(),
        statsApi.getPlatformStats(),
        profileApi.getAllProfiles(),
        gpuApi.getAllGpus(),
        requestApi.getAllRequests(),
        activityApi.getAllActivities()
      ]);
      
      setCurrentProfile(profile);
      setStats(platformStats);
      setUsers(allUsers);
      setGpus(allGpus);
      setRequests(allRequests);
      setActivities(allActivities);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
      
      // 如果加载失败，使用模拟数据
      setStats({
        total_users: 156,
        total_gpus: 48,
        online_gpus: 32,
        pending_requests: 8,
        completed_requests: 1247
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      if (demoUser) {
        // 演示模式下的模拟操作
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        toast.success('用户角色更新成功（演示模式）');
        return;
      }
      
      await profileApi.updateProfile(userId, { role: newRole });
      toast.success('用户角色更新成功');
      loadData();
    } catch (error) {
      console.error('更新用户角色失败:', error);
      toast.error('更新用户角色失败');
    }
  };

  const handleUpdateUserType = async (userId: string, newType: 'demander' | 'supplier' | 'both') => {
    try {
      if (demoUser) {
        // 演示模式下的模拟操作
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, user_type: newType } : user
        ));
        toast.success('用户类型更新成功（演示模式）');
        return;
      }
      
      await profileApi.updateProfile(userId, { user_type: newType });
      toast.success('用户类型更新成功');
      loadData();
    } catch (error) {
      console.error('更新用户类型失败:', error);
      toast.error('更新用户类型失败');
    }
  };

  // 检查是否为管理员（优先检查演示用户）
  const isAdmin = demoUser ? demoUser.role === 'admin' : (currentProfile?.role === 'admin');
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">访问受限</CardTitle>
            <CardDescription>
              您没有权限访问管理后台，请使用管理员账号登录。
              <br />
              <span className="text-sm text-blue-600 mt-2 block">
                测试管理员账号：admin / 123456
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string, type: 'gpu' | 'request') => {
    if (type === 'gpu') {
      const statusConfig = {
        online: { label: '在线', variant: 'default' as const },
        offline: { label: '离线', variant: 'secondary' as const },
        busy: { label: '忙碌', variant: 'destructive' as const }
      };
      const config = statusConfig[status as keyof typeof statusConfig];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    } else {
      const statusConfig = {
        pending: { label: '等待中', variant: 'secondary' as const },
        matched: { label: '已匹配', variant: 'default' as const },
        running: { label: '运行中', variant: 'default' as const },
        completed: { label: '已完成', variant: 'default' as const },
        failed: { label: '失败', variant: 'destructive' as const }
      };
      const config = statusConfig[status as keyof typeof statusConfig];
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? 
      <Badge variant="destructive">管理员</Badge> : 
      <Badge variant="secondary">普通用户</Badge>;
  };

  const getUserTypeBadge = (userType: string) => {
    const typeConfig = {
      demander: { label: '需求方', variant: 'default' as const },
      supplier: { label: '供给方', variant: 'outline' as const },
      both: { label: '双重角色', variant: 'secondary' as const }
    };
    const config = typeConfig[userType as keyof typeof typeConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">管理后台</h1>
            <p className="text-xl text-gray-600">平台管理和监控中心</p>
          </div>
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">注册用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                平台总用户数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GPU资源</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_gpus}</div>
              <p className="text-xs text-muted-foreground">
                总GPU设备数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">在线设备</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.online_gpus}</div>
              <p className="text-xs text-muted-foreground">
                当前在线GPU
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待处理</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.pending_requests}</div>
              <p className="text-xs text-muted-foreground">
                待处理请求
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.completed_requests}</div>
              <p className="text-xs text-muted-foreground">
                完成任务数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 管理标签页 */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="gpus">GPU管理</TabsTrigger>
            <TabsTrigger value="requests">请求管理</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
            <TabsTrigger value="activities">活动记录</TabsTrigger>
          </TabsList>

          {/* 用户管理 */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  用户管理
                </CardTitle>
                <CardDescription>
                  管理平台用户的角色和权限
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{user.username}</h4>
                          {getRoleBadge(user.role)}
                          {getUserTypeBadge(user.user_type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">手机号:</span> {user.phone}
                        </div>
                        <div>
                          <span className="font-medium">用户ID:</span> {user.id.slice(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">注册时间:</span> {new Date(user.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* 管理操作 */}
                      <div className="flex gap-4 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">角色:</span>
                          <Select 
                            value={user.role} 
                            onValueChange={(value: 'user' | 'admin') => handleUpdateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">普通用户</SelectItem>
                              <SelectItem value="admin">管理员</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">类型:</span>
                          <Select 
                            value={user.user_type} 
                            onValueChange={(value: 'demander' | 'supplier' | 'both') => handleUpdateUserType(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="demander">需求方</SelectItem>
                              <SelectItem value="supplier">供给方</SelectItem>
                              <SelectItem value="both">双重角色</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 活动记录管理 */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-600" />
                  用户活动记录
                </CardTitle>
                <CardDescription>
                  实时监控用户登录和操作活动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 活动统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">总活动数</p>
                            <p className="text-2xl font-bold">{activities.length}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">登录次数</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => a.activity_type === "login").length}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">最近活动</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => {
                                const activityTime = new Date(a.created_at).getTime();
                                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                                return activityTime > oneDayAgo;
                              }).length}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 活动记录表格 */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户</TableHead>
                          <TableHead>活动类型</TableHead>
                          <TableHead>详细信息</TableHead>
                          <TableHead>时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              暂无活动记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          activities.slice(0, 20).map((activity) => (
                            <TableRow key={activity.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {activity.activity_data.username || "未知用户"}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {activity.activity_data.phone || activity.user_id}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={activity.activity_type === "login" ? "default" : "secondary"}
                                  className="capitalize"
                                >
                                  {activity.activity_type === "login" ? "登录" : 
                                   activity.activity_type === "gpu_share" ? "GPU共享" :
                                   activity.activity_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  {activity.activity_type === "login" && (
                                    <>
                                      <div>方式: {activity.activity_data.login_method === "password" ? "密码" : "短信"}</div>
                                      <div>角色: {activity.activity_data.role === "admin" ? "管理员" : "用户"}</div>
                                      {activity.activity_data.ip_address && (
                                        <div>IP: {activity.activity_data.ip_address}</div>
                                      )}
                                    </>
                                  )}
                                  {activity.activity_type === "gpu_share" && (
                                    <>
                                      <div>GPU: {activity.activity_data.gpu_name}</div>
                                      <div>操作: {activity.activity_data.action === "enable_sharing" ? "启用共享" : "禁用共享"}</div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(activity.created_at).toLocaleString("zh-CN")}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {activities.length > 20 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => toast.info("显示更多功能开发中...")}>
                        显示更多活动记录
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GPU管理 */}
          <TabsContent value="gpus">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-6 w-6 text-green-600" />
                  GPU资源管理
                </CardTitle>
                <CardDescription>
                  监控和管理所有GPU设备
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gpus.map((gpu) => (
                    <div key={gpu.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{gpu.gpu_name}</h4>
                          {getStatusBadge(gpu.status, 'gpu')}
                          {gpu.is_shared && (
                            <Badge variant="outline" className="text-green-600">
                              共享中
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          性能评分: {gpu.performance_score}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">显存:</span> {gpu.gpu_memory}GB
                        </div>
                        <div>
                          <span className="font-medium">计算能力:</span> {gpu.compute_capability || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">创建时间:</span> {new Date(gpu.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">更新时间:</span> {new Date(gpu.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 活动记录管理 */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-600" />
                  用户活动记录
                </CardTitle>
                <CardDescription>
                  实时监控用户登录和操作活动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 活动统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">总活动数</p>
                            <p className="text-2xl font-bold">{activities.length}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">登录次数</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => a.activity_type === "login").length}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">最近活动</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => {
                                const activityTime = new Date(a.created_at).getTime();
                                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                                return activityTime > oneDayAgo;
                              }).length}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 活动记录表格 */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户</TableHead>
                          <TableHead>活动类型</TableHead>
                          <TableHead>详细信息</TableHead>
                          <TableHead>时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              暂无活动记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          activities.slice(0, 20).map((activity) => (
                            <TableRow key={activity.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {activity.activity_data.username || "未知用户"}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {activity.activity_data.phone || activity.user_id}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={activity.activity_type === "login" ? "default" : "secondary"}
                                  className="capitalize"
                                >
                                  {activity.activity_type === "login" ? "登录" : 
                                   activity.activity_type === "gpu_share" ? "GPU共享" :
                                   activity.activity_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  {activity.activity_type === "login" && (
                                    <>
                                      <div>方式: {activity.activity_data.login_method === "password" ? "密码" : "短信"}</div>
                                      <div>角色: {activity.activity_data.role === "admin" ? "管理员" : "用户"}</div>
                                      {activity.activity_data.ip_address && (
                                        <div>IP: {activity.activity_data.ip_address}</div>
                                      )}
                                    </>
                                  )}
                                  {activity.activity_type === "gpu_share" && (
                                    <>
                                      <div>GPU: {activity.activity_data.gpu_name}</div>
                                      <div>操作: {activity.activity_data.action === "enable_sharing" ? "启用共享" : "禁用共享"}</div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(activity.created_at).toLocaleString("zh-CN")}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {activities.length > 20 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => toast.info("显示更多功能开发中...")}>
                        显示更多活动记录
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 请求管理 */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-600" />
                  算力请求管理
                </CardTitle>
                <CardDescription>
                  监控和处理所有算力请求
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.slice(0, 10).map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status, 'request')}
                          <Badge variant="outline">
                            {request.priority === 'high' ? '高优先级' : 
                             request.priority === 'normal' ? '普通优先级' : '低优先级'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2">
                        {request.task_description}
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">所需显存:</span> {request.required_memory}GB
                        </div>
                        <div>
                          <span className="font-medium">预估时长:</span> {request.estimated_duration}分钟
                        </div>
                        <div>
                          <span className="font-medium">请求ID:</span> {request.id.slice(0, 8)}...
                        </div>
                        <div>
                          <span className="font-medium">用户ID:</span> {request.requester_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 活动记录管理 */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-600" />
                  用户活动记录
                </CardTitle>
                <CardDescription>
                  实时监控用户登录和操作活动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 活动统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">总活动数</p>
                            <p className="text-2xl font-bold">{activities.length}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">登录次数</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => a.activity_type === "login").length}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">最近活动</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => {
                                const activityTime = new Date(a.created_at).getTime();
                                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                                return activityTime > oneDayAgo;
                              }).length}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 活动记录表格 */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户</TableHead>
                          <TableHead>活动类型</TableHead>
                          <TableHead>详细信息</TableHead>
                          <TableHead>时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              暂无活动记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          activities.slice(0, 20).map((activity) => (
                            <TableRow key={activity.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {activity.activity_data.username || "未知用户"}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {activity.activity_data.phone || activity.user_id}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={activity.activity_type === "login" ? "default" : "secondary"}
                                  className="capitalize"
                                >
                                  {activity.activity_type === "login" ? "登录" : 
                                   activity.activity_type === "gpu_share" ? "GPU共享" :
                                   activity.activity_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  {activity.activity_type === "login" && (
                                    <>
                                      <div>方式: {activity.activity_data.login_method === "password" ? "密码" : "短信"}</div>
                                      <div>角色: {activity.activity_data.role === "admin" ? "管理员" : "用户"}</div>
                                      {activity.activity_data.ip_address && (
                                        <div>IP: {activity.activity_data.ip_address}</div>
                                      )}
                                    </>
                                  )}
                                  {activity.activity_type === "gpu_share" && (
                                    <>
                                      <div>GPU: {activity.activity_data.gpu_name}</div>
                                      <div>操作: {activity.activity_data.action === "enable_sharing" ? "启用共享" : "禁用共享"}</div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(activity.created_at).toLocaleString("zh-CN")}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {activities.length > 20 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => toast.info("显示更多功能开发中...")}>
                        显示更多活动记录
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 数据分析 */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    平台使用统计
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>用户注册率</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GPU利用率</span>
                    <span className="font-medium">
                      {stats.total_gpus > 0 ? Math.round((stats.online_gpus / stats.total_gpus) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>请求完成率</span>
                    <span className="font-medium">
                      {(stats.pending_requests + stats.completed_requests) > 0 ? 
                        Math.round((stats.completed_requests / (stats.pending_requests + stats.completed_requests)) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    系统健康状态
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>系统状态</span>
                    <Badge variant="default">正常运行</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>在线设备</span>
                    <Badge variant={stats.online_gpus > 0 ? "default" : "secondary"}>
                      {stats.online_gpus > 0 ? "有设备在线" : "无设备在线"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>待处理请求</span>
                    <Badge variant={stats.pending_requests > 0 ? "destructive" : "default"}>
                      {stats.pending_requests} 个
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 活动记录管理 */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-600" />
                  用户活动记录
                </CardTitle>
                <CardDescription>
                  实时监控用户登录和操作活动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 活动统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">总活动数</p>
                            <p className="text-2xl font-bold">{activities.length}</p>
                          </div>
                          <Activity className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">登录次数</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => a.activity_type === "login").length}
                            </p>
                          </div>
                          <Users className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">最近活动</p>
                            <p className="text-2xl font-bold">
                              {activities.filter(a => {
                                const activityTime = new Date(a.created_at).getTime();
                                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                                return activityTime > oneDayAgo;
                              }).length}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 活动记录表格 */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户</TableHead>
                          <TableHead>活动类型</TableHead>
                          <TableHead>详细信息</TableHead>
                          <TableHead>时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                              暂无活动记录
                            </TableCell>
                          </TableRow>
                        ) : (
                          activities.slice(0, 20).map((activity) => (
                            <TableRow key={activity.id}>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {activity.activity_data.username || "未知用户"}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {activity.activity_data.phone || activity.user_id}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={activity.activity_type === "login" ? "default" : "secondary"}
                                  className="capitalize"
                                >
                                  {activity.activity_type === "login" ? "登录" : 
                                   activity.activity_type === "gpu_share" ? "GPU共享" :
                                   activity.activity_type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm space-y-1">
                                  {activity.activity_type === "login" && (
                                    <>
                                      <div>方式: {activity.activity_data.login_method === "password" ? "密码" : "短信"}</div>
                                      <div>角色: {activity.activity_data.role === "admin" ? "管理员" : "用户"}</div>
                                      {activity.activity_data.ip_address && (
                                        <div>IP: {activity.activity_data.ip_address}</div>
                                      )}
                                    </>
                                  )}
                                  {activity.activity_type === "gpu_share" && (
                                    <>
                                      <div>GPU: {activity.activity_data.gpu_name}</div>
                                      <div>操作: {activity.activity_data.action === "enable_sharing" ? "启用共享" : "禁用共享"}</div>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(activity.created_at).toLocaleString("zh-CN")}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {activities.length > 20 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => toast.info("显示更多功能开发中...")}>
                        显示更多活动记录
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;