import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Share2, 
  Plus, 
  Settings, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { gpuApi, scheduleApi } from '@/db/api';
import type { GpuResource, SharingSchedule, CreateGpuResourceForm, CreateSharingScheduleForm } from '@/types/types';

const ComputeSupply: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [userGpus, setUserGpus] = useState<GpuResource[]>([]);
  const [schedules, setSchedules] = useState<SharingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGpu, setSelectedGpu] = useState<string>('');

  const gpuForm = useForm<CreateGpuResourceForm>({
    defaultValues: {
      gpu_name: '',
      gpu_memory: 8,
      compute_capability: '',
      is_shared: false
    }
  });

  const scheduleForm = useForm<CreateSharingScheduleForm>({
    defaultValues: {
      gpu_id: '',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '18:00'
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gpus = await gpuApi.getUserGpus();
      setUserGpus(gpus);
      
      if (gpus.length > 0) {
        const allSchedules = await Promise.all(
          gpus.map(gpu => scheduleApi.getGpuSchedules(gpu.id))
        );
        setSchedules(allSchedules.flat());
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    }
  };

  const handleAddGpu = async (data: CreateGpuResourceForm) => {
    setIsLoading(true);
    try {
      await gpuApi.createGpu(data);
      toast.success('GPU资源添加成功');
      gpuForm.reset();
      loadData();
    } catch (error) {
      console.error('添加GPU失败:', error);
      toast.error('添加GPU失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGpuSharing = async (gpuId: string, isShared: boolean) => {
    try {
      await gpuApi.toggleGpuSharing(gpuId, isShared);
      toast.success(isShared ? 'GPU共享已启用' : 'GPU共享已关闭');
      loadData();
    } catch (error) {
      console.error('切换GPU共享状态失败:', error);
      toast.error('操作失败');
    }
  };

  const handleUpdateGpuStatus = async (gpuId: string, status: 'online' | 'offline') => {
    try {
      await gpuApi.updateGpuStatus(gpuId, status);
      toast.success(`GPU已${status === 'online' ? '上线' : '下线'}`);
      loadData();
    } catch (error) {
      console.error('更新GPU状态失败:', error);
      toast.error('操作失败');
    }
  };

  const handleAddSchedule = async (data: CreateSharingScheduleForm) => {
    if (!selectedGpu) {
      toast.error('请选择GPU');
      return;
    }

    setIsLoading(true);
    try {
      await scheduleApi.createSchedule({
        ...data,
        gpu_id: selectedGpu
      });
      toast.success('共享时段添加成功');
      scheduleForm.reset();
      loadData();
    } catch (error) {
      console.error('添加共享时段失败:', error);
      toast.error('添加共享时段失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: GpuResource['status']) => {
    const statusConfig = {
      online: { label: '在线', variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" /> },
      offline: { label: '离线', variant: 'secondary' as const, icon: <XCircle className="h-3 w-3" /> },
      busy: { label: '忙碌', variant: 'destructive' as const, icon: <Clock className="h-3 w-3" /> }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[dayOfWeek];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">算力供给</h1>
          <p className="text-xl text-gray-600">共享您的闲置GPU资源，为算力网络贡献力量</p>
        </div>

        {/* 功能控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-6 w-6 text-green-600" />
              算力供给控制
            </CardTitle>
            <CardDescription>
              启用后您的GPU资源将加入共享池，为其他用户提供算力支持
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="supply-enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
              <Label htmlFor="supply-enabled" className="text-sm font-medium">
                {isEnabled ? '算力供给已启用' : '算力供给已关闭'}
              </Label>
            </div>
            {isEnabled && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">算力供给功能已启用</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  您的GPU资源现在可以被其他用户使用，感谢您的贡献！
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 添加GPU资源 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-6 w-6 text-blue-600" />
                添加GPU资源
              </CardTitle>
              <CardDescription>
                将您的GPU设备添加到算力共享池中
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...gpuForm}>
                <form onSubmit={gpuForm.handleSubmit(handleAddGpu)} className="space-y-4">
                  <FormField
                    control={gpuForm.control}
                    name="gpu_name"
                    rules={{ required: '请输入GPU名称' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GPU名称</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例如: NVIDIA RTX 4090"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gpuForm.control}
                    name="gpu_memory"
                    rules={{ 
                      required: '请输入显存大小',
                      min: { value: 1, message: '显存至少为1GB' }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>显存大小 (GB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="24"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gpuForm.control}
                    name="compute_capability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>计算能力 (可选)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例如: 8.9"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gpuForm.control}
                    name="is_shared"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            立即共享
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            添加后立即启用共享功能
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        添加中...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        添加GPU资源
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 共享时段设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-purple-600" />
                共享时段设置
              </CardTitle>
              <CardDescription>
                为您的GPU设置可共享的时间段
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(handleAddSchedule)} className="space-y-4">
                  <FormField
                    control={scheduleForm.control}
                    name="gpu_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>选择GPU</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedGpu(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择要设置时段的GPU" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {userGpus.map((gpu) => (
                              <SelectItem key={gpu.id} value={gpu.id}>
                                {gpu.gpu_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={scheduleForm.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>星期</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择星期" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">周日</SelectItem>
                            <SelectItem value="1">周一</SelectItem>
                            <SelectItem value="2">周二</SelectItem>
                            <SelectItem value="3">周三</SelectItem>
                            <SelectItem value="4">周四</SelectItem>
                            <SelectItem value="5">周五</SelectItem>
                            <SelectItem value="6">周六</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={scheduleForm.control}
                      name="start_time"
                      rules={{ required: '请选择开始时间' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>开始时间</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={scheduleForm.control}
                      name="end_time"
                      rules={{ required: '请选择结束时间' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>结束时间</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !selectedGpu}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        添加中...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        添加共享时段
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* 我的GPU资源 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-6 w-6 text-green-600" />
              我的GPU资源
            </CardTitle>
            <CardDescription>
              管理您的GPU设备和共享状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userGpus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>您还没有添加任何GPU资源</p>
                  <p className="text-sm">请先添加GPU设备以开始共享算力</p>
                </div>
              ) : (
                userGpus.map((gpu) => (
                  <div key={gpu.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{gpu.gpu_name}</h4>
                        {getStatusBadge(gpu.status)}
                        {gpu.is_shared && (
                          <Badge variant="outline" className="text-green-600">
                            共享中
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateGpuStatus(
                            gpu.id, 
                            gpu.status === 'online' ? 'offline' : 'online'
                          )}
                        >
                          {gpu.status === 'online' ? '下线' : '上线'}
                        </Button>
                        <Switch
                          checked={gpu.is_shared}
                          onCheckedChange={(checked) => handleToggleGpuSharing(gpu.id, checked)}
                        />
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
                        <span className="font-medium">创建时间:</span> {new Date(gpu.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* 显示该GPU的共享时段 */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">共享时段</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {schedules
                          .filter(schedule => schedule.gpu_id === gpu.id)
                          .map((schedule) => (
                            <Badge key={schedule.id} variant="secondary" className="text-xs">
                              {getDayName(schedule.day_of_week)} {schedule.start_time}-{schedule.end_time}
                            </Badge>
                          ))}
                        {schedules.filter(schedule => schedule.gpu_id === gpu.id).length === 0 && (
                          <span className="text-sm text-gray-500">暂无设置共享时段</span>
                        )}
                      </div>
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

export default ComputeSupply;