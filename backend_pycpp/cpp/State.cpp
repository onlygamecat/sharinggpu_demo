#include "State.hpp"
#include <algorithm>
#include <random>

static std::string uuid4();
static bool isZero(const std::chrono::system_clock::time_point& tp){ return tp.time_since_epoch().count()==0; }

State& State::instance(){ static State S; return S; }

State::State(){
  auto now = std::chrono::system_clock::now();
  auto addGpu = [&](const std::string& name,int mem,int score,const std::string& cc){
    auto id = uuid4();
    GpuResource g; g.id=id; g.gpu_name=name; g.gpu_memory=mem; g.performance_score=score;
    g.compute_capability=cc; g.is_shared=true; g.status="online"; g.created_at=now; g.updated_at=now;
    gpus_[id]=g; gpu_used_mem_[id]=0;
  };
  addGpu("RTX 4090",24,100,"8.9");
  addGpu("A100 80G",80,120,"8.0");
  addGpu("RTX 3080",10,70,"8.6");
  seed();
}

void State::seed(){
  auto now = std::chrono::system_clock::now();
  auto gpu_ids = std::vector<std::string>{};
  for (auto& kv : gpus_) gpu_ids.push_back(kv.first);
  auto gid0 = gpu_ids.size()>0?gpu_ids[0]:"";
  auto gid1 = gpu_ids.size()>1?gpu_ids[1]:gid0;
  auto gid2 = gpu_ids.size()>2?gpu_ids[2]:gid0;

  // running on gid0
  {
    ComputeRequest r;
    r.id=uuid4(); r.task_description="大语料数据清洗与统计";
    r.required_memory=10; r.estimated_duration=90; r.priority="normal";
    r.status="running"; r.assigned_gpu_id=gid0;
    r.created_at=now - std::chrono::hours(1);
    r.started_at=now - std::chrono::minutes(55);
    reqs_[r.id]=r; allocMem(gid0,10);
  }
  // running on gid1
  {
    ComputeRequest r;
    r.id=uuid4(); r.task_description="Stable Diffusion 批量渲染";
    r.required_memory=16; r.estimated_duration=120; r.priority="high";
    r.status="running"; r.assigned_gpu_id=gid1;
    r.created_at=now - std::chrono::hours(2);
    r.started_at=now - std::chrono::hours(1) - std::chrono::minutes(20);
    reqs_[r.id]=r; allocMem(gid1,16);
  }
  // completed on gid2
  {
    ComputeRequest r;
    r.id=uuid4(); r.task_description="小规模推理服务压测";
    r.required_memory=8; r.estimated_duration=30; r.priority="normal";
    r.status="completed"; r.assigned_gpu_id=gid2;
    r.created_at=now - std::chrono::hours(3);
    r.started_at=now - std::chrono::hours(2) - std::chrono::minutes(50);
    r.completed_at=now - std::chrono::hours(2) - std::chrono::minutes(20);
    reqs_[r.id]=r; /* 已完成默认释放 */
  }
}

std::vector<GpuResource> State::listGpus(const std::string& q, const std::string& status){
  std::lock_guard<std::mutex> lk(mu_);
  for (auto& kv : gpus_) recomputeGpuStatus(kv.first);
  std::vector<GpuResource> v; v.reserve(gpus_.size());
  for (auto& kv : gpus_){
    auto& g = kv.second;
    if (!q.empty() && g.gpu_name.find(q)==std::string::npos) continue;
    if (!status.empty() && status!="all" && g.status!=status) continue;
    v.push_back(g);
  }
  return v;
}

std::vector<ComputeRequest> State::listRequests(const std::string& q, const std::string& status){
  std::lock_guard<std::mutex> lk(mu_);
  std::vector<ComputeRequest> v; v.reserve(reqs_.size());
  for (auto& kv : reqs_){
    auto& r = kv.second;
    if (!q.empty() && r.task_description.find(q)==std::string::npos) continue;
    if (!status.empty() && status!="all" && r.status!=status) continue;
    v.push_back(r);
  }
  std::sort(v.begin(), v.end(), [](auto& a, auto& b){ return a.created_at > b.created_at; });
  return v;
}

PlatformStats State::stats(){
  std::lock_guard<std::mutex> lk(mu_);
  PlatformStats s;
  s.total_users = total_users_;
  s.total_gpus = (int)gpus_.size();
  for (auto& kv : gpus_) if (kv.second.status=="online") s.online_gpus++;
  for (auto& kv : reqs_) {
    if (kv.second.status=="pending") s.pending_requests++;
    if (kv.second.status=="completed") s.completed_requests++;
  }
  return s;
}

ComputeRequest State::createRequest(const std::string& desc, int mem, int estMin, const std::string& pri){
  std::lock_guard<std::mutex> lk(mu_);
  ComputeRequest r;
  r.id=uuid4(); r.task_description=desc; r.required_memory=mem; r.estimated_duration=estMin; r.priority=pri;
  r.status="pending"; r.created_at=std::chrono::system_clock::now();
  reqs_[r.id]=r;
  return r;
}

bool State::matchRequest(const std::string& reqId, const std::string& gpuId, ComputeRequest* out){
  std::lock_guard<std::mutex> lk(mu_);
  auto itR = reqs_.find(reqId); auto itG = gpus_.find(gpuId);
  if (itR==reqs_.end() || itG==gpus_.end()) return false;
  auto& r = itR->second; auto& g = itG->second;
  if (!g.is_shared) return false;
  if (freeMemOf(gpuId) < r.required_memory) return false;

  allocMem(gpuId, r.required_memory);
  r.assigned_gpu_id=gpuId; r.status="running"; r.started_at=std::chrono::system_clock::now();
  if (out) *out = r;
  return true;
}

bool State::updateRequestStatus(const std::string& reqId, const std::string& st, ComputeRequest* out){
  std::lock_guard<std::mutex> lk(mu_);
  auto it = reqs_.find(reqId); if (it==reqs_.end()) return false;
  auto& r = it->second;
  auto now = std::chrono::system_clock::now();

  if (st=="running"){
    r.status="running";
    if (isZero(r.started_at)) r.started_at=now;
    if (!r.assigned_gpu_id.empty() && freeMemOf(r.assigned_gpu_id) >= r.required_memory) {
      allocMem(r.assigned_gpu_id, r.required_memory);
    }
  } else if (st=="completed" || st=="failed"){
    r.status=st; r.completed_at=now;
    if (!r.assigned_gpu_id.empty()) freeMem(r.assigned_gpu_id, r.required_memory);
  } else if (st=="pending"){
    if (!r.assigned_gpu_id.empty()) freeMem(r.assigned_gpu_id, r.required_memory);
    r.status="pending"; r.assigned_gpu_id.clear(); r.started_at={}; r.completed_at={};
  } else {
    r.status=st;
  }
  if (out) *out = r;
  return true;
}

void State::allocMem(const std::string& gpuId, int mem){
  auto& used = gpu_used_mem_[gpuId];
  used += mem; recomputeGpuStatus(gpuId);
}
void State::freeMem(const std::string& gpuId, int mem){
  auto& used = gpu_used_mem_[gpuId];
  used = std::max(0, used - mem); recomputeGpuStatus(gpuId);
}
int State::freeMemOf(const std::string& gpuId){
  auto itG = gpus_.find(gpuId); if (itG==gpus_.end()) return 0;
  int cap = itG->second.gpu_memory;
  int used = gpu_used_mem_[gpuId];
  return std::max(0, cap - used);
}
void State::recomputeGpuStatus(const std::string& gpuId){
  auto& g = gpus_[gpuId];
  g.status = (gpu_used_mem_[gpuId]>0) ? "busy" : "online";
  g.updated_at = std::chrono::system_clock::now();
}


#include <random>
static std::string uuid4(){
  static std::mt19937_64 rng{std::random_device{}()};
  static const char* hex="0123456789abcdef";
  std::string s(36,' ');
  int n[16]; for(int&i:n) i=(int)rng();
  int idx=0;
  for (int i=0;i<36;i++){
    if (i==8||i==13||i==18||i==23){ s[i]='-'; continue; }
    int v = n[idx/8] >> (4*(idx%8)) & 0xF;
    s[i]=hex[v]; idx++;
  }
  s[14]='4'; // version
  return s;
}
