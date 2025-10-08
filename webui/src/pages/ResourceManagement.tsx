import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { gpuApi, requestApi, statsApi } from '@/db/api_rest';
import type { GpuResource, ComputeRequest, PlatformStats } from '@/types/types';

const ResourceManagement: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    total_gpus: 0,
    online_gpus: 0,
    pending_requests: 0,
    completed_requests: 0
  });
  const [gpus, setGpus] = useState<GpuResource[]>([]);
  const [requests, setRequests] = useState<ComputeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [platformStats, allGpus, allRequests] = await Promise.all([
        statsApi.getPlatformStats(),
        gpuApi.getAllGpus(),
        requestApi.getAllRequests()
      ]);
      
      setStats(platformStats);
      setGpus(allGpus);
      setRequests(allRequests);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchRequest = async (requestId: string, gpuId: string) => {
    try {
      await requestApi.matchRequestToGpu(requestId, gpuId);
      toast.success('算力请求匹配成功');
      loadData();
    } catch (error) {
      console.error('匹配失败:', error);
      toast.error('匹配失败');
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: ComputeRequest['status']) => {
    try {
      await requestApi.updateRequestStatus(requestId, status);
      toast.success('状态更新成功');
      loadData();
    } catch (error) {
      console.error('状态更新失败:', error);
      toast.error('状态更新失败');
    }
  };

  const getStatusBadge = (status: string, type: 'gpu' | 'request') => {
    if (type === 'gpu') {
      const statusConfig = {
        online: { label: '在线', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
        offline: { label: '离线', variant: 'secondary' as const, icon: <XCircle className="h-3 w-3" /> },
        busy: { label: '忙碌', variant: 'destructive' as const, icon: <Clock className="h-3 w-3" /> }
      };
      const config = statusConfig[status as keyof typeof statusConfig];
      return (
        <Badge variant={config.variant} className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </Badge>
      );
    } else {
      const statusConfig = {
        pending: { label: '等待中', variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> },
        matched: { label: '已匹配', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
        running: { label: '运行中', variant: 'default' as const, icon: <Activity className="h-3 w-3" /> },
        completed: { label: '已完成', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
        failed: { label: '失败', variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> }
      };
      const config = statusConfig[status as keyof typeof statusConfig];
      return (
        <Badge variant={config.variant} className="flex items-center gap-1">
          {config.icon}
          {config.label}
        </Badge>
      );
    }
  };

  const filteredGpus = gpus.filter(gpu => {
    const matchesSearch = gpu.gpu_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gpu.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.task_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableGpus = gpus.filter(gpu => gpu.status === 'online' && gpu.is_shared);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">资源管理</h1>
            <p className="text-xl text-gray-600">监控和管理平台的算力资源与请求</p>
          </div>
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">注册用户</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GPU总数</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.total_gpus}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">在线GPU</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.online_gpus}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待处理请求</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.pending_requests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已完成任务</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.completed_requests}</div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              搜索和筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="搜索GPU名称或任务描述..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="online">在线</SelectItem>
                  <SelectItem value="offline">离线</SelectItem>
                  <SelectItem value="busy">忙碌</SelectItem>
                  <SelectItem value="pending">等待中</SelectItem>
                  <SelectItem value="running">运行中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 资源管理标签页 */}
        <Tabs defaultValue="gpus" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gpus">GPU资源管理</TabsTrigger>
            <TabsTrigger value="requests">算力请求管理</TabsTrigger>
          </TabsList>

          {/* GPU资源管理 */}
          <TabsContent value="gpus">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-6 w-6 text-green-600" />
                  GPU资源列表
                </CardTitle>
                <CardDescription>
                  查看和管理所有GPU资源的状态和配置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredGpus.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>没有找到匹配的GPU资源</p>
                    </div>
                  ) : (
                    filteredGpus.map((gpu) => (
                      <div key={gpu.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                            {new Date(gpu.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">显存:</span> {gpu.gpu_memory}GB
                          </div>
                          <div>
                            <span className="font-medium">性能评分:</span> {gpu.performance_score}
                          </div>
                          {gpu.compute_capability && (
                            <div>
                              <span className="font-medium">计算能力:</span> {gpu.compute_capability}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">更新时间:</span> {new Date(gpu.updated_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 算力请求管理 */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-purple-600" />
                  算力请求列表
                </CardTitle>
                <CardDescription>
                  管理和处理用户的算力请求
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>没有找到匹配的算力请求</p>
                    </div>
                  ) : (
                    filteredRequests.map((request) => (
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
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">所需显存:</span> {request.required_memory}GB
                          </div>
                          <div>
                            <span className="font-medium">预估时长:</span> {request.estimated_duration}分钟
                          </div>
                          {request.started_at && (
                            <div>
                              <span className="font-medium">开始时间:</span> {new Date(request.started_at).toLocaleString()}
                            </div>
                          )}
                          {request.completed_at && (
                            <div>
                              <span className="font-medium">完成时间:</span> {new Date(request.completed_at).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* 管理操作 */}
                        {request.status === 'pending' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Select onValueChange={(gpuId) => handleMatchRequest(request.id, gpuId)}>
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="选择GPU匹配" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableGpus
                                  .filter(gpu => gpu.gpu_memory >= request.required_memory)
                                  .map((gpu) => (
                                    <SelectItem key={gpu.id} value={gpu.id}>
                                      {gpu.gpu_name} ({gpu.gpu_memory}GB)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateRequestStatus(request.id, 'failed')}
                            >
                              拒绝请求
                            </Button>
                          </div>
                        )}

                        {request.status === 'matched' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, 'running')}
                            >
                              开始执行
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateRequestStatus(request.id, 'pending')}
                            >
                              取消匹配
                            </Button>
                          </div>
                        )}

                        {request.status === 'running' && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRequestStatus(request.id, 'completed')}
                            >
                              标记完成
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateRequestStatus(request.id, 'failed')}
                            >
                              标记失败
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
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

export default ResourceManagement;