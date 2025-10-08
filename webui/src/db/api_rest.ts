// src/db/api_rest.ts
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

// 只用 Vite 的 import.meta.env，外加一个 window 兜底（可选）
const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  (typeof window !== 'undefined' && (window as any).__API_BASE__) ||
  'http://localhost:9000'; // 注意端口与你后端一致


async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    // 若需要带 cookie，打开：
    // credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/** ---------------- Profile 相关（如果 REST 暂时没实现，可先占位/返回 null） ---------------- */
export const profileApi = {
  async getCurrentProfile(): Promise<Profile | null> {
    // 若 FastAPI 里还没做 /me，可先返回 null，或者从你已有的鉴权里获取
    return null;
  },
  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
    throw new Error('Not implemented in REST yet');
  },
  async getAllProfiles(): Promise<Profile[]> {
    throw new Error('Not implemented in REST yet');
  }
};

/** ---------------- GPU 资源 ---------------- */
export const gpuApi = {
  // 对应 GET /gpus?q=...&status=...
  async getAllGpus(params?: { q?: string; status?: string }): Promise<GpuResource[]> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    return getJSON<GpuResource[]>(`${API_BASE}/gpus${q.toString() ? `?${q}` : ''}`);
  },

  // 如果需要“可用 GPU”，可以在 FastAPI 实现 status=online&is_shared=true 的过滤，
  // 这里先用客户端过滤（示例）：
  async getAvailableGpus(): Promise<GpuResource[]> {
    const all = await gpuApi.getAllGpus({ status: 'online' });
    return all.filter(g => g.is_shared);
  },

  // 其余 CRUD 如需走 REST，可继续加路由；这里保持最小可用
  async getUserGpus(): Promise<GpuResource[]> {
    return [];
  },
  async createGpu(_: CreateGpuResourceForm): Promise<GpuResource> {
    throw new Error('Not implemented in REST yet');
  },
  async updateGpuStatus(_: string, __: 'online' | 'offline' | 'busy'): Promise<GpuResource> {
    throw new Error('Not implemented in REST yet');
  },
  async toggleGpuSharing(_: string, __: boolean): Promise<GpuResource> {
    throw new Error('Not implemented in REST yet');
  },
};

/** ---------------- 算力请求 ---------------- */
export const requestApi = {
  // 对应 GET /requests?q=...&status=...
  async getAllRequests(params?: { q?: string; status?: string }): Promise<ComputeRequest[]> {
    const q = new URLSearchParams();
    if (params?.q) q.set('q', params.q);
    if (params?.status) q.set('status', params.status);
    return getJSON<ComputeRequest[]>(`${API_BASE}/requests${q.toString() ? `?${q}` : ''}`);
  },

  // 对应 POST /requests
  async createRequest(body: CreateComputeRequestForm): Promise<ComputeRequest> {
    return getJSON<ComputeRequest>(`${API_BASE}/requests`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // 对应 POST /requests/{id}/match  body: { gpu_id }
  async matchRequestToGpu(requestId: string, gpuId: string): Promise<ComputeRequest> {
    return getJSON<ComputeRequest>(`${API_BASE}/requests/${requestId}/match`, {
      method: 'POST',
      body: JSON.stringify({ gpu_id: gpuId }),
    });
  },

  // 对应 POST /requests/{id}/status  body: { status }
  async updateRequestStatus(id: string, status: ComputeRequest['status']): Promise<ComputeRequest> {
    return getJSON<ComputeRequest>(`${API_BASE}/requests/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  async getUserRequests(): Promise<ComputeRequest[]> {
    // 如需区分“当前用户”，后端需要鉴权；暂时用 getAllRequests 代替或添加 query
    return requestApi.getAllRequests();
  },
};

/** ---------------- 共享时段（如果后端暂未提供，可先空实现） ---------------- */
export const scheduleApi = {
  async createSchedule(_: CreateSharingScheduleForm): Promise<SharingSchedule> {
    throw new Error('Not implemented in REST yet');
  },
  async getGpuSchedules(_: string): Promise<SharingSchedule[]> {
    return [];
  },
  async updateSchedule(_: string, __: Partial<SharingSchedule>): Promise<SharingSchedule> {
    throw new Error('Not implemented in REST yet');
  },
  async deleteSchedule(_: string): Promise<void> {
    throw new Error('Not implemented in REST yet');
  },
};

/** ---------------- 平台统计 ---------------- */
// 对应 GET /stats
export const statsApi = {
  async getPlatformStats(): Promise<PlatformStats> {
    return getJSON<PlatformStats>(`${API_BASE}/stats`);
  }
};

/** ---------------- 活动日志（可选） ---------------- */
export const activityApi = {
  async recordLoginActivity(): Promise<UserActivity> {
    throw new Error('Not implemented in REST yet');
  },
  async recordUserActivity(): Promise<UserActivity> {
    throw new Error('Not implemented in REST yet');
  },
  async getUserActivities(): Promise<UserActivity[]> {
    return [];
  },
  async getAllActivities(): Promise<UserActivity[]> {
    return [];
  },
  async getActivityStats(): Promise<{ total_activities: number; login_count: number; recent_activities: number; }> {
    return { total_activities: 0, login_count: 0, recent_activities: 0 };
  },
};
