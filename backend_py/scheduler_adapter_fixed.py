# scheduler_adapter.py
from typing import List, Optional
from datetime import datetime, timedelta
from threading import Lock
import uuid
from models import GpuResource, ComputeRequest, PlatformStats

class VirtualScheduler:
    def __init__(self, seed_users: int = 12):
        self._lock = Lock()
        self._gpus: dict[str, GpuResource] = {}
        self._reqs: dict[str, ComputeRequest] = {}
        self._total_users = seed_users  # 用于 PlatformStats.total_users

        # 1) 初始化一些虚拟 GPU
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

        # 2) 初始化一些虚拟请求（含多种状态）
        #    为了更真实：创建时间往前推、运行/完成时间合理安排
        self._seed_requests()

    # —— GPU 接口 ——
    def list_gpus(self, q: str|None=None, status: str|None=None) -> List[GpuResource]:
        with self._lock:
            items = list(self._gpus.values())
            if q:
                ql = q.lower()
                items = [g for g in items if ql in g.gpu_name.lower()]
            if status and status != "all":
                items = [g for g in items if g.status == status]
            return items

    # —— 请求接口 ——
    def list_requests(self, q: str|None=None, status: str|None=None) -> List[ComputeRequest]:
        with self._lock:
            items = list(self._reqs.values())
            if q:
                ql = q.lower()
                items = [r for r in items if ql in r.task_description.lower()]
            if status and status != "all":
                items = [r for r in items if r.status == status]
            return items

    def create_request(self, task_description: str, required_memory: int, estimated_duration: int, priority: str="normal") -> ComputeRequest:
        with self._lock:
            rid = str(uuid.uuid4()); now = datetime.utcnow()
            req = ComputeRequest(
                id=rid, task_description=task_description, required_memory=required_memory,
                estimated_duration=estimated_duration, priority=priority, status="pending",
                created_at=now
            )
            self._reqs[rid] = req
            return req

    def match_request(self, request_id: str, gpu_id: str) -> Optional[ComputeRequest]:
        with self._lock:
            req = self._reqs.get(request_id); gpu = self._gpus.get(gpu_id)
            if not req or not gpu: return None
            if gpu.status != "online" or not gpu.is_shared or gpu.gpu_memory < req.required_memory:
                return None
            req.assigned_gpu_id = gpu_id
            req.status = "matched"
            req.started_at = datetime.utcnow()
            gpu.status = "busy"
            gpu.updated_at = datetime.utcnow()
            return req

    def update_request_status(self, request_id: str, status: str) -> Optional[ComputeRequest]:
        with self._lock:
            req = self._reqs.get(request_id)
            if not req: return None
            req.status = status  # running/completed/failed/pending
            now = datetime.utcnow()
            if status == "running":
                req.started_at = now
                # 若没绑定 GPU，则不改 GPU；若已绑定且 GPU 存在，状态保持 busy
            if status in ("completed","failed"):
                req.completed_at = now
                # 释放 GPU（若有）
                if req.assigned_gpu_id and req.assigned_gpu_id in self._gpus:
                    g = self._gpus[req.assigned_gpu_id]
                    g.status = "online"; g.updated_at = now
            if status == "pending":
                # 取消匹配
                if req.assigned_gpu_id and req.assigned_gpu_id in self._gpus:
                    g = self._gpus[req.assigned_gpu_id]
                    g.status = "online"; g.updated_at = now
                req.assigned_gpu_id = None; req.started_at = None; req.completed_at = None
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

    # —— 内部：初始化请求种子数据 ——
    def _seed_requests(self):
        now = datetime.utcnow()

        # 选几个 GPU id
        gpu_ids = list(self._gpus.keys())
        gpu_for_matched = gpu_ids[0] if len(gpu_ids) > 0 else None
        gpu_for_running = gpu_ids[1] if len(gpu_ids) > 1 else gpu_for_matched
        gpu_for_completed = gpu_ids[2] if len(gpu_ids) > 2 else gpu_for_matched

        # 1) pending（2条）—— 修复：统一使用同一个 rid
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

        # 2) matched（1条）→ 绑定 GPU，GPU 置 busy
        if gpu_for_matched:
            rid = str_uuid()
            self._reqs[rid] = ComputeRequest(
                id=rid, task_description="大语料数据清洗与统计",
                required_memory=10, estimated_duration=90, priority="normal",
                status="matched", assigned_gpu_id=gpu_for_matched,
                created_at=now - timedelta(hours=1), started_at=now - timedelta(minutes=55)
            )
            g = self._gpus[gpu_for_matched]
            g.status = "busy"; g.updated_at = now - timedelta(minutes=55)

        # 3) running（1条）→ 绑定 GPU，GPU 置 busy
        if gpu_for_running:
            rid = str_uuid()
            self._reqs[rid] = ComputeRequest(
                id=rid, task_description="Stable Diffusion 批量渲染",
                required_memory=16, estimated_duration=120, priority="high",
                status="running", assigned_gpu_id=gpu_for_running,
                created_at=now - timedelta(hours=2), started_at=now - timedelta(hours=1, minutes=20)
            )
            g = self._gpus[gpu_for_running]
            g.status = "busy"; g.updated_at = now - timedelta(hours=1, minutes=20)

        # 4) completed（1条）→ 已完成应释放 GPU（保持 online）
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
            # 确保释放
            g = self._gpus[gpu_for_completed]
            g.status = "online"; g.updated_at = now - timedelta(hours=2, minutes=20)

        # 5) failed（1条）→ 失败也应释放 GPU（若有绑定）
        rid = str_uuid()
        self._reqs[rid] = ComputeRequest(
            id=rid, task_description="视频分割模型训练（测试）",
            required_memory=12, estimated_duration=40, priority="normal",
            status="failed",
            created_at=now - timedelta(hours=4),
            started_at=now - timedelta(hours=3, minutes=50),
            completed_at=now - timedelta(hours=3, minutes=40)
        )
        # 失败任务此处不强制绑定 GPU；如需绑定再释放可按需添加

def str_uuid() -> str:
    return str(uuid.uuid4())

scheduler = VirtualScheduler()
