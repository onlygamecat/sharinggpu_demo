// 数据库表对应的TypeScript类型定义

export interface Profile {
  id: string;
  user_id: string;
  phone: string;
  username: string;
  role: 'user' | 'admin';
  user_type: 'demander' | 'supplier' | 'both';
  created_at: string;
}

export interface GpuResource {
  id: string;
  owner_id: string;
  gpu_name: string;
  gpu_memory: number;
  compute_capability?: string;
  status: 'online' | 'offline' | 'busy';
  is_shared: boolean;
  performance_score: number;
  created_at: string;
  updated_at: string;
}

export interface ComputeRequest {
  id: string;
  requester_id: string;
  assigned_gpu_id?: string;
  task_description: string;
  required_memory: number;
  estimated_duration: number;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'matched' | 'running' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface SharingSchedule {
  id: string;
  user_id: string;
  gpu_id: string;
  day_of_week: number; // 0-6, 0为周日
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

// 用户活动记录表
export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  activity_data: {
    username?: string;
    phone?: string;
    role?: string;
    login_method?: string;
    ip_address?: string;
    user_agent?: string;
    timestamp?: string;
    [key: string]: any;
  };
  created_at: string;
}

// 扩展类型，用于UI显示
export interface GpuResourceWithOwner extends GpuResource {
  owner?: Profile;
}

export interface ComputeRequestWithDetails extends ComputeRequest {
  requester?: Profile;
  assigned_gpu?: GpuResource;
}

export interface SharingScheduleWithGpu extends SharingSchedule {
  gpu?: GpuResource;
}

// 表单类型
export interface CreateGpuResourceForm {
  gpu_name: string;
  gpu_memory: number;
  compute_capability?: string;
  is_shared: boolean;
}

export interface CreateComputeRequestForm {
  task_description: string;
  required_memory: number;
  estimated_duration: number;
  priority: 'low' | 'normal' | 'high';
}

export interface CreateSharingScheduleForm {
  gpu_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

// 统计数据类型
export interface PlatformStats {
  total_users: number;
  total_gpus: number;
  online_gpus: number;
  pending_requests: number;
  completed_requests: number;
}