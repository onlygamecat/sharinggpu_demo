# scheduler_cxx_adapter.py
import cxxsched
from datetime import datetime, timezone
from typing import Optional, List
from models import GpuResource, ComputeRequest, PlatformStats

def _ms_to_dt(ms: int | None):
    if not ms: return None
    return datetime.fromtimestamp(ms/1000, tz=timezone.utc)

class scheduler:
    def __init__(self, enable_simulation: bool = True):
        if enable_simulation:
            cxxsched.start_simulator()

    def stats(self) -> PlatformStats:
        d = cxxsched.stats()
        return PlatformStats(**d)  # 字段名对齐

    def list_gpus(self, q: Optional[str]=None, status: Optional[str]=None) -> List[GpuResource]:
        arr = cxxsched.list_gpus(q or "", status or "")
        out = []
        for d in arr:
            d["created_at"]  = _ms_to_dt(d["created_at"])
            d["updated_at"]  = _ms_to_dt(d["updated_at"])
            out.append(GpuResource(**d))
        return out

    def list_requests(self, q: Optional[str]=None, status: Optional[str]=None) -> List[ComputeRequest]:
        arr = cxxsched.list_requests(q or "", status or "")
        out = []
        for d in arr:
            d["created_at"]  = _ms_to_dt(d["created_at"])
            d["started_at"]  = _ms_to_dt(d["started_at"])
            d["completed_at"]= _ms_to_dt(d["completed_at"])
            out.append(ComputeRequest(**d))
        return out

    def create_request(self, task_description: str, required_memory: int,
                       estimated_duration: int, priority: str="normal") -> ComputeRequest:
        d = cxxsched.create_request(task_description, required_memory, estimated_duration, priority)
        d["created_at"]=_ms_to_dt(d["created_at"])
        return ComputeRequest(**d)

    def match_request(self, request_id: str, gpu_id: str):
        r = cxxsched.match_request(request_id, gpu_id)
        if r is None: return None
        r["created_at"]=_ms_to_dt(r["created_at"]); r["started_at"]=_ms_to_dt(r["started_at"])
        return ComputeRequest(**r)

    def update_request_status(self, request_id: str, status: str):
        r = cxxsched.update_request_status(request_id, status)
        if r is None: return None
        for k in ("created_at","started_at","completed_at"):
            r[k]=_ms_to_dt(r[k])
        return ComputeRequest(**r)

# 供 main.py 导入
scheduler = scheduler(enable_simulation=True)
