import { supabase } from './supabase';
import type { 
  Profile, 
  GpuResource, 
  ComputeRequest, 
  SharingSchedule,
  UserActivity,
  CreateGpuResourceForm,
  CreateComputeRequestForm,
  CreateSharingScheduleForm,
  PlatformStats
} from '@/types/types';

// Profile 相关API
export const profileApi = {
  // 获取当前用户档案
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : null;
  },

  // 更新用户档案
  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as Profile;
  },

  // 获取所有用户（管理员）
  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  }
};

// GPU资源相关API
export const gpuApi = {
  // 获取所有可用GPU资源
  async getAvailableGpus(): Promise<GpuResource[]> {
    const { data, error } = await supabase
      .from('gpu_resources')
      .select('*')
      .eq('is_shared', true)
      .eq('status', 'online')
      .order('performance_score', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  },

  // 获取用户的GPU资源
  async getUserGpus(): Promise<GpuResource[]> {
    const profile = await profileApi.getCurrentProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('gpu_resources')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  },

  // 创建GPU资源
  async createGpu(gpuData: CreateGpuResourceForm): Promise<GpuResource> {
    const profile = await profileApi.getCurrentProfile();
    if (!profile) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('gpu_resources')
      .insert({
        ...gpuData,
        owner_id: profile.id,
        status: 'offline'
      })
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as GpuResource;
  },

  // 更新GPU状态
  async updateGpuStatus(id: string, status: 'online' | 'offline' | 'busy'): Promise<GpuResource> {
    const { data, error } = await supabase
      .from('gpu_resources')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as GpuResource;
  },

  // 切换GPU共享状态
  async toggleGpuSharing(id: string, is_shared: boolean): Promise<GpuResource> {
    const { data, error } = await supabase
      .from('gpu_resources')
      .update({ 
        is_shared,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as GpuResource;
  },

  // 获取所有GPU资源（管理员）
  async getAllGpus(): Promise<GpuResource[]> {
    const { data, error } = await supabase
      .from('gpu_resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  }
};

// 算力请求相关API
export const requestApi = {
  // 创建算力请求
  async createRequest(requestData: CreateComputeRequestForm): Promise<ComputeRequest> {
    const profile = await profileApi.getCurrentProfile();
    if (!profile) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('compute_requests')
      .insert({
        ...requestData,
        requester_id: profile.id
      })
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as ComputeRequest;
  },

  // 获取用户的算力请求
  async getUserRequests(): Promise<ComputeRequest[]> {
    const profile = await profileApi.getCurrentProfile();
    if (!profile) return [];

    const { data, error } = await supabase
      .from('compute_requests')
      .select('*')
      .eq('requester_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  },

  // 匹配算力请求到GPU
  async matchRequestToGpu(requestId: string, gpuId: string): Promise<ComputeRequest> {
    const { data, error } = await supabase
      .from('compute_requests')
      .update({
        assigned_gpu_id: gpuId,
        status: 'matched',
        started_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as ComputeRequest;
  },

  // 更新请求状态
  async updateRequestStatus(id: string, status: ComputeRequest['status']): Promise<ComputeRequest> {
    const updates: any = { status };
    
    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('compute_requests')
      .update(updates)
      .eq('id', id)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as ComputeRequest;
  },

  // 获取所有算力请求（管理员）
  async getAllRequests(): Promise<ComputeRequest[]> {
    const { data, error } = await supabase
      .from('compute_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  }
};

// 共享时段相关API
export const scheduleApi = {
  // 创建共享时段
  async createSchedule(scheduleData: CreateSharingScheduleForm): Promise<SharingSchedule> {
    const { data, error } = await supabase
      .from('sharing_schedules')
      .insert(scheduleData)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as SharingSchedule;
  },

  // 获取GPU的共享时段
  async getGpuSchedules(gpuId: string): Promise<SharingSchedule[]> {
    const { data, error } = await supabase
      .from('sharing_schedules')
      .select('*')
      .eq('gpu_id', gpuId)
      .order('day_of_week', { ascending: true });

    if (error) throw error;
    return Array.isArray(data) && data ? data : [];
  },

  // 更新共享时段
  async updateSchedule(id: string, updates: Partial<SharingSchedule>): Promise<SharingSchedule> {
    const { data, error } = await supabase
      .from('sharing_schedules')
      .update(updates)
      .eq('id', id)
      .select('*')
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return (Array.isArray(data) && data && data.length > 0) ? data[0] : {} as SharingSchedule;
  },

  // 删除共享时段
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('sharing_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// 平台统计API
export const statsApi = {
  // 获取平台统计数据
  async getPlatformStats(): Promise<PlatformStats> {
    const [usersResult, gpusResult, requestsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('gpu_resources').select('id, status', { count: 'exact' }),
      supabase.from('compute_requests').select('id, status', { count: 'exact' })
    ]);

    const totalUsers = usersResult.count || 0;
    const totalGpus = gpusResult.count || 0;
    const onlineGpus = gpusResult.data?.filter(gpu => gpu.status === 'online').length || 0;
    const pendingRequests = requestsResult.data?.filter(req => req.status === 'pending').length || 0;
    const completedRequests = requestsResult.data?.filter(req => req.status === 'completed').length || 0;

    return {
      total_users: totalUsers,
      total_gpus: totalGpus,
      online_gpus: onlineGpus,
      pending_requests: pendingRequests,
      completed_requests: completedRequests
    };
  }
};

// 用户活动记录API
export const activityApi = {
  // 记录用户登录活动
  recordLoginActivity: async (userId: string, userInfo: {
    username?: string;
    phone?: string;
    role?: string;
    loginMethod?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<UserActivity> => {
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: 'login',
        activity_data: {
          username: userInfo.username || '',
          phone: userInfo.phone || '',
          role: userInfo.role || 'user',
          login_method: userInfo.loginMethod || 'password',
          ip_address: userInfo.ipAddress || '',
          user_agent: userInfo.userAgent || navigator.userAgent || '',
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .select()
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return Array.isArray(data) && data.length > 0 ? data[0] : {} as UserActivity;
  },

  // 记录用户操作活动
  recordUserActivity: async (userId: string, activityType: string, activityData: any): Promise<UserActivity> => {
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_data: {
          ...activityData,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })
      .select()
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;
    return Array.isArray(data) && data.length > 0 ? data[0] : {} as UserActivity;
  },

  // 获取用户活动记录
  getUserActivities: async (userId: string, limit: number = 50): Promise<UserActivity[]> => {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  // 获取所有用户活动记录（管理员功能）
  getAllActivities: async (limit: number = 100): Promise<UserActivity[]> => {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  // 获取活动统计
  getActivityStats: async (): Promise<{
    total_activities: number;
    login_count: number;
    recent_activities: number;
  }> => {
    try {
      // 获取总活动数
      const { count: totalCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true });

      // 获取登录活动数
      const { count: loginCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'login');

      // 获取最近24小时活动数
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      return {
        total_activities: totalCount || 0,
        login_count: loginCount || 0,
        recent_activities: recentCount || 0
      };
    } catch (error) {
      console.error('获取活动统计失败:', error);
      return {
        total_activities: 0,
        login_count: 0,
        recent_activities: 0
      };
    }
  }
};