import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { gpuApi, requestApi } from '@/db/api';
import type { GpuResource, ComputeRequest, CreateComputeRequestForm } from '@/types/types';

const ComputeDemand: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [availableGpus, setAvailableGpus] = useState<GpuResource[]>([]);
  const [userRequests, setUserRequests] = useState<ComputeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateComputeRequestForm>({
    defaultValues: {
      task_description: '',
      required_memory: 8,
      estimated_duration: 60,
      priority: 'normal'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gpus, requests] = await Promise.all([
        gpuApi.getAvailableGpus(),
        requestApi.getUserRequests()
      ]);
      setAvailableGpus(gpus);
      setUserRequests(requests);
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    }
  };

  const handleSubmitRequest = async (data: CreateComputeRequestForm) => {
    if (!isEnabled) {
      toast.error('请先启用算力需求功能');
      return;
    }

    setIsLoading(true);
    try {
      await requestApi.createRequest(data);
      toast.success('算力请求提交成功');
      form.reset();
      loadData();
    } catch (error) {
      console.error('提交请求失败:', error);
      toast.error('提交请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ComputeRequest['status']) => {
    const statusConfig = {
      pending: { label: '等待中', variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> },
      matched: { label: '已匹配', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
      running: { label: '运行中', variant: 'default' as const, icon: <Play className="h-3 w-3" /> },
      completed: { label: '已完成', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
      failed: { label: '失败', variant: 'destructive' as const, icon: <AlertCircle className="h-3 w-3" /> }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ComputeRequest['priority']) => {
    const priorityConfig = {
      low: { label: '低', variant: 'secondary' as const },
      normal: { label: '普通', variant: 'outline' as const },
      high: { label: '高', variant: 'destructive' as const }
    };

    const config = priorityConfig[priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">算力需求</h1>
          <p className="text-xl text-gray-600">申请和管理您的算力资源需求</p>
        </div>

        {/* 功能控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-6 w-6 text-blue-600" />
              算力需求控制
            </CardTitle>
            <CardDescription>
              启用后可以申请算力资源，系统将自动匹配最合适的GPU
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="demand-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
              <Label htmlFor="demand-enabled" className="text-sm font-medium">
                {isEnabled ? '算力需求已启用' : '算力需求已关闭'}
              </Label>
            </div>
            {isEnabled && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">算力需求功能已启用</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  您现在可以提交算力请求，系统将自动为您匹配合适的GPU资源
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 算力请求表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-600" />
                提交算力请求
              </CardTitle>
              <CardDescription>
                填写您的计算任务需求，系统将智能匹配最合适的GPU资源
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitRequest)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="task_description"
                    rules={{ required: '请输入任务描述' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>任务描述</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请描述您的计算任务..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="required_memory"
                    rules={{ 
                      required: '请输入所需显存',
                      min: { value: 1, message: '显存需求至少为1GB' }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所需显存 (GB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimated_duration"
                    rules={{ 
                      required: '请输入预估时长',
                      min: { value: 1, message: '时长至少为1分钟' }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>预估时长 (分钟)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优先级</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择优先级" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">低优先级</SelectItem>
                            <SelectItem value="normal">普通优先级</SelectItem>
                            <SelectItem value="high">高优先级</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!isEnabled || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        提交算力请求
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 可用GPU资源 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-6 w-6 text-green-600" />
                可用GPU资源
              </CardTitle>
              <CardDescription>
                当前局域网内可用的GPU资源列表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableGpus.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无可用的GPU资源</p>
                  </div>
                ) : (
                  availableGpus.map((gpu) => (
                    <div key={gpu.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{gpu.gpu_name}</h4>
                        <Badge variant="outline" className="text-green-600">
                          在线
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>显存: {gpu.gpu_memory}GB</div>
                        <div>性能评分: {gpu.performance_score}</div>
                        {gpu.compute_capability && (
                          <div className="col-span-2">
                            计算能力: {gpu.compute_capability}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 我的算力请求 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-purple-600" />
              我的算力请求
            </CardTitle>
            <CardDescription>
              查看您提交的算力请求状态和历史记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>您还没有提交任何算力请求</p>
                </div>
              ) : (
                userRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComputeDemand;