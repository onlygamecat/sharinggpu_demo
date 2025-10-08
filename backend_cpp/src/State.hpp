#pragma once
#include <string>
#include <unordered_map>
#include <vector>
#include <mutex>
#include <chrono>

struct GpuResource {
  std::string id;
  std::string gpu_name;
  int gpu_memory = 0;
  int performance_score = 0;
  std::string compute_capability;
  bool is_shared = true;
  std::string status = "offline"; // online/offline/busy
  std::chrono::system_clock::time_point created_at;
  std::chrono::system_clock::time_point updated_at;
};

struct ComputeRequest {
  std::string id;
  std::string task_description;
  int required_memory = 0;
  int estimated_duration = 0; // minutes
  std::string priority = "normal"; // low/normal/high
  std::string status = "pending";   // pending/matched/running/completed/failed
  std::string assigned_gpu_id;      // optional
  std::chrono::system_clock::time_point created_at;
  std::chrono::system_clock::time_point started_at;    // 0 = null
  std::chrono::system_clock::time_point completed_at;  // 0 = null
};

struct PlatformStats {
  int total_users = 0;
  int total_gpus = 0;
  int online_gpus = 0;
  int pending_requests = 0;
  int completed_requests = 0;
};

class State {
public:
  static State& instance();

  // 查询
  std::vector<GpuResource> listGpus(const std::string& q, const std::string& status);
  std::vector<ComputeRequest> listRequests(const std::string& q, const std::string& status);
  PlatformStats stats();

  // 修改
  ComputeRequest createRequest(const std::string& desc, int mem, int estMin, const std::string& pri);
  bool matchRequest(const std::string& reqId, const std::string& gpuId, ComputeRequest* out);
  bool updateRequestStatus(const std::string& reqId, const std::string& st, ComputeRequest* out);

  // 模拟/采集入口
  void seed();
  void allocMem(const std::string& gpuId, int mem);
  void freeMem(const std::string& gpuId, int mem);
  int  freeMemOf(const std::string& gpuId);
  void recomputeGpuStatus(const std::string& gpuId);

private:
  State();
  std::mutex mu_;
  std::unordered_map<std::string,GpuResource> gpus_;
  std::unordered_map<std::string,ComputeRequest> reqs_;
  std::unordered_map<std::string,int> gpu_used_mem_;
  int total_users_ = 12;
};
