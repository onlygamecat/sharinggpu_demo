# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from scheduler_cxx_adapter import scheduler
from models import ComputeRequest
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GPU Resource Monitor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175", "http://localhost:3000", "http://127.0.0.1:5175"],  # 你的前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchBody(BaseModel):
    gpu_id: str

class CreateReqBody(BaseModel):
    task_description: str
    required_memory: int
    estimated_duration: int
    priority: Optional[str] = "normal"

@app.get("/stats")
def get_stats():
    return scheduler.stats()

@app.get("/gpus")
def get_gpus(q: Optional[str]=None, status: Optional[str]=None):
    return scheduler.list_gpus(q=q, status=status)

@app.get("/requests")
def get_requests(q: Optional[str]=None, status: Optional[str]=None):
    return scheduler.list_requests(q=q, status=status)

@app.post("/requests")
def create_request(body: CreateReqBody) -> ComputeRequest:
    return scheduler.create_request(
        task_description=body.task_description,
        required_memory=body.required_memory,
        estimated_duration=body.estimated_duration,
        priority=body.priority or "normal"
    )

@app.post("/requests/{rid}/match")
def match_request(rid: str, body: MatchBody):
    res = scheduler.match_request(rid, body.gpu_id)
    if not res:
        raise HTTPException(status_code=400, detail="匹配失败：GPU不可用或请求不存在")
    return res

class StatusBody(BaseModel):
    status: str  # pending/running/completed/failed

@app.post("/requests/{rid}/status")
def update_request_status(rid: str, body: StatusBody):
    res = scheduler.update_request_status(rid, body.status)
    if not res:
        raise HTTPException(status_code=404, detail="请求不存在")
    return res
