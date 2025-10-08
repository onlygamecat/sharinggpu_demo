# models.py
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

GpuStatus = Literal["online","offline","busy"]
ReqStatus = Literal["pending","matched","running","completed","failed"]
Priority  = Literal["low","normal","high"]

class GpuResource(BaseModel):
    id: str
    gpu_name: str
    gpu_memory: int
    performance_score: int
    compute_capability: Optional[str] = None
    is_shared: bool = True
    status: GpuStatus = "offline"
    created_at: datetime
    updated_at: datetime

class ComputeRequest(BaseModel):
    id: str
    task_description: str
    required_memory: int
    estimated_duration: int
    priority: Priority = "normal"
    status: ReqStatus = "pending"
    assigned_gpu_id: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class PlatformStats(BaseModel):
    total_users: int = 0
    total_gpus: int = 0
    online_gpus: int = 0
    pending_requests: int = 0
    completed_requests: int = 0
