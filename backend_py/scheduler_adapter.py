# scheduler_adapter.py
from typing import List, Optional
from datetime import datetime, timedelta
from threading import Lock, Thread, Timer
import threading
import time
import uuid
import random

from models import GpuResource, ComputeRequest, PlatformStats

REQUEST_INTERVAL_SEC = 10          # 每隔 N 秒生成一个新请求
RUNTIME_SEC_RANGE = (20, 45)       # 运行时长范围（秒）——为了演示快一点
REQ_MEMORY_CHOICES = [4, 8, 12, 16]  # 新请求可能需要的显存(GB)
REQ_DURATION_CHOICES = [15, 30, 45, 60, 90]  # 估计时长(分钟)
REQ_PRIORITY_CHOICES = ["low", "normal", "high"]

class VirtualScheduler:
    def __init__(self, seed_users: int = 12, enable_simulation: bool = True):
        self._lock = Lock()
        self._gpus: dict[str, GpuResource] = {}
        self._reqs: dict[str, ComputeRequest] = {}
        self._total_users = seed_users

        # 额外：每块 GPU 已用显存（GB）
        self._gpu_used_mem: dict[str, int] = {}

        # 1) 初始化 GPU
        now = datetime.now()
        for name, mem, score, cc in [
            ("RTX 4090", 24, 100, "8.9"),
            ("A100 80G", 80, 120, "8.0"),
            ("RTX 3080", 10, 70,  "8.6"),
        ]:
            gid = str(uuid.uuid4())
            self._gpus[gid] = GpuResource(
                id=gid, gpu_name=name, gpu_memory=mem, performance_score=score,
                compute_capability=cc, is_shared=True, status="online",
                created_at=now, updated_at=now
            )
            self._gpu_used_mem[gid] = 0  # 初始未使用

        # 2) 种子请求
        self._seed_requests()

        # 3) 启动后台仿真（可关）
        self._sim_stop = threading.Event()
        if enable_simulation:
            self._sim_thread = Thread(target=self._simulate_loop, daemon=True)
            self._sim_thread.start()

    # ----------------- 内部：显存/状态管理 -----------------
    def _gpu_free_mem(self, gpu_id: str) -> int:
        g = self._gpus[gpu_id]
        used = self._gpu_used_mem.get(gpu_id, 0)
        return max(0, g.gpu_memory - used)

    def _alloc_mem(self, gpu_id: str, mem: int) -> bool:
        """尝试在 gpu 上分配 mem GB 显存；成功返回 True。"""
        if gpu_id not in self._gpus: return False
        free = self._gpu_free_mem(gpu_id)
        if free < mem: return False
        self._gpu_used_mem[gpu_id] = self._gpu_used_mem.get(gpu_id, 0) + mem
        self._recompute_gpu_status(gpu_id)
        return True

    def _free_mem(self, gpu_id: str, mem: int):
        if gpu_id not in self._gpus: return
        self._gpu_used_mem[gpu_id] = max(0, self._gpu_used_mem.get(gpu_id, 0) - mem)
        self._recompute_gpu_status(gpu_id)

    def _recompute_gpu_status(self, gpu_id: str):
        """根据已用显存是否>0 设置 online/busy（允许 busy 时继续接任务）"""
        g = self._gpus[gpu_id]
        g.status = "busy" if self._gpu_used_mem.get(gpu_id, 0) > 0 else "online"
        g.updated_at = datetime.now()

    # ----------------- 对外：GPU/请求接口 -----------------
    def list_gpus(self, q: str|None=None, status: str|None=None) -> List[GpuResource]:
        with self._lock:
            # 动态刷新 GPU 状态（防止长时间不调用时状态过期）
            for gid in list(self._gpus.keys()):
                self._recompute_gpu_status(gid)

            items = list(self._gpus.values())
            if q:
                ql = q.lower()
                items = [g for g in items if ql in g.gpu_name.lower()]
            if status and status != "all":
                items = [g for g in items if g.status == status]
            return items

    def list_requests(self, q: str|None=None, status: str|None=None) -> List[ComputeRequest]:
        with self._lock:
            items = list(self._reqs.values())
            if q:
                ql = q.lower()
                items = [r for r in items if ql in r.task_description.lower()]
            if status and status != "all":
                items = [r for r in items if r.status == status]
            # 可按时间排序，最新在前：
            items.sort(key=lambda r: r.created_at, reverse=True)
            return items

    def create_request(self, task_description: str, required_memory: int, estimated_duration: int, priority: str="normal") -> ComputeRequest:
        with self._lock:
            rid = str_uuid(); now = datetime.now()
            req = ComputeRequest(
                id=rid, task_description=task_description, required_memory=required_memory,
                estimated_duration=estimated_duration, priority=priority, status="pending",
                created_at=now
            )
            self._reqs[rid] = req
            return req

    def match_request(self, request_id: str, gpu_id: str) -> Optional[ComputeRequest]:
        """前端手动匹配：允许匹配到 online/busy 的共享 GPU，只要显存足够"""
        with self._lock:
            req = self._reqs.get(request_id); gpu = self._gpus.get(gpu_id)
            if not req or not gpu: return None
            if not gpu.is_shared: return None
            # busy 也允许，只要显存足够
            if self._gpu_free_mem(gpu_id) < req.required_memory:
                return None

            # 分配显存并置为 running（也可先置 matched，再由前端点“开始执行”）
            if not self._alloc_mem(gpu_id, req.required_memory):
                return None

            now = datetime.now()
            req.assigned_gpu_id = gpu_id
            req.status = "matched"
            req.started_at = now
            # 这里可以按你的业务需求：立刻进入 running
            req.status = "running"
            return req

    def update_request_status(self, request_id: str, status: str) -> Optional[ComputeRequest]:
        with self._lock:
            req = self._reqs.get(request_id)
            if not req: return None
            now = datetime.now()

            if status == "running":
                req.status = "running"
                if not req.started_at:
                    req.started_at = now
                # 若运行时没有显存（例如手动切 running），尝试分配
                if req.assigned_gpu_id:
                    if self._gpu_free_mem(req.assigned_gpu_id) >= req.required_memory:
                        self._alloc_mem(req.assigned_gpu_id, req.required_memory)
                    # 否则保持当前（也可直接返回 None 表示失败）
                return req

            if status in ("completed", "failed"):
                req.status = status
                req.completed_at = now
                # 释放显存
                if req.assigned_gpu_id:
                    self._free_mem(req.assigned_gpu_id, req.required_memory)
                return req

            if status == "pending":
                # 取消匹配：释放显存、清除绑定
                if req.assigned_gpu_id:
                    self._free_mem(req.assigned_gpu_id, req.required_memory)
                req.status = "pending"
                req.assigned_gpu_id = None
                req.started_at = None
                req.completed_at = None
                return req

            # 其他状态（matched等）按需扩展
            req.status = status
            return req

    def stats(self) -> PlatformStats:
        with self._lock:
            gpus = list(self._gpus.values()); reqs = list(self._reqs.values())
            return PlatformStats(
                total_users=self._total_users,
                total_gpus=len(gpus),
                online_gpus=sum(1 for g in gpus if g.status == "online"),
                pending_requests=sum(1 for r in reqs if r.status == "pending"),
                completed_requests=sum(1 for r in reqs if r.status == "completed"),
            )

    # ----------------- 内部：初始化请求种子数据 -----------------
    def _seed_requests(self):
        now = datetime.now()
        gpu_ids = list(self._gpus.keys())
        gpu_for_matched = gpu_ids[0] if len(gpu_ids) > 0 else None
        gpu_for_running = gpu_ids[1] if len(gpu_ids) > 1 else gpu_for_matched
        gpu_for_completed = gpu_ids[2] if len(gpu_ids) > 2 else gpu_for_matched

        # 1) pending（2条）
        '''
        rid = str_uuid()
        self._reqs[rid] = ComputeRequest(
            id=rid, task_description="训练文本分类模型（小规模）",
            required_memory=8, estimated_duration=45, priority="normal",
            status="pending", created_at=now - timedelta(minutes=30)
        )
        rid = str_uuid()
        self._reqs[rid] = ComputeRequest(
            id=rid, task_description="图像超分实验（2x）",
            required_memory=12, estimated_duration=60, priority="low",
            status="pending", created_at=now - timedelta(minutes=10)
        )
        '''

        # 2) matched->running
        if gpu_for_matched:
            rid = str_uuid()
            self._reqs[rid] = ComputeRequest(
                id=rid, task_description="大语料数据清洗与统计",
                required_memory=10, estimated_duration=90, priority="normal",
                status="running", assigned_gpu_id=gpu_for_matched,
                created_at=now - timedelta(hours=1), started_at=now - timedelta(minutes=55)
            )
            # 分配显存
            self._alloc_mem(gpu_for_matched, 10)

        # 3) running
        if gpu_for_running:
            rid = str_uuid()
            self._reqs[rid] = ComputeRequest(
                id=rid, task_description="Stable Diffusion 批量渲染",
                required_memory=16, estimated_duration=120, priority="high",
                status="running", assigned_gpu_id=gpu_for_running,
                created_at=now - timedelta(hours=2), started_at=now - timedelta(hours=1, minutes=20)
            )
            self._alloc_mem(gpu_for_running, 16)

        # 4) completed（释放显存）
        if gpu_for_completed:
            rid = str_uuid()
            self._reqs[rid] = ComputeRequest(
                id=rid, task_description="小规模推理服务压测",
                required_memory=8, estimated_duration=30, priority="normal",
                status="completed", assigned_gpu_id=gpu_for_completed,
                created_at=now - timedelta(hours=3),
                started_at=now - timedelta(hours=2, minutes=50),
                completed_at=now - timedelta(hours=2, minutes=20)
            )
            # 确保已释放
            self._free_mem(gpu_for_completed, 0)  # no-op, 只是触发状态刷新

        # 5) failed（已释放）
        rid = str_uuid()
        self._reqs[rid] = ComputeRequest(
            id=rid, task_description="视频分割模型训练（测试）",
            required_memory=12, estimated_duration=40, priority="normal",
            status="completed", assigned_gpu_id=gpu_for_completed,
            created_at=now - timedelta(hours=4),
            started_at=now - timedelta(hours=3, minutes=50),
            completed_at=now - timedelta(hours=3, minutes=40)
        )

    # ----------------- 内部：自动调度/完成 -----------------
    def _simulate_loop(self):
        """后台线程：周期性创建请求并尝试自动调度、计时完成"""
        while not self._sim_stop.is_set():
            try:
                self._auto_spawn_and_schedule()
            except Exception as e:
                # 避免线程因异常退出
                print("[Simulator] error:", e)
            self._sim_stop.wait(REQUEST_INTERVAL_SEC)

    def _auto_spawn_and_schedule(self):
        # 1) 生成一个随机请求
        desc = random.choice([
            "自动生成：微型训练任务",
            "自动生成：批量推理任务",
            "自动生成：图像处理实验",
            "自动生成：数据预处理作业"
        ])
        mem = random.choice(REQ_MEMORY_CHOICES)
        est = random.choice(REQ_DURATION_CHOICES)
        pri = random.choice(REQ_PRIORITY_CHOICES)

        req = self.create_request(desc, mem, est, pri)

        # 2) 尝试自动匹配到某个 GPU（按可用显存从大到小）
        with self._lock:
            # 计算每个 GPU 的可用显存
            candidates = sorted(
                [(gid, self._gpu_free_mem(gid)) for gid in self._gpus if self._gpus[gid].is_shared],
                key=lambda x: x[1],
                reverse=True
            )
            chosen = None
            for gid, free in candidates:
                if free >= mem:
                    chosen = gid
                    break

            if chosen is None:
                # 没 GPU 可用：保持 pending
                return

            # 分配并置 running
            if not self._alloc_mem(chosen, mem):
                return
            now = datetime.now()
            req.assigned_gpu_id = chosen
            req.status = "running"
            req.started_at = now

            # 3) 设置完成计时器
            duration = random.randint(*RUNTIME_SEC_RANGE)
            Timer(duration, self._auto_complete, args=[req.id]).start()

    def _auto_complete(self, request_id: str):
        # 到时自动完成并释放显存
        self.update_request_status(request_id, "completed")

    # ----------------- 控制模拟 -----------------
    def stop_simulation(self):
        self._sim_stop.set()

def str_uuid() -> str:
    return str(uuid.uuid4())

scheduler = VirtualScheduler(enable_simulation=True)
