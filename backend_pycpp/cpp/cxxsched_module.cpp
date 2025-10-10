// cxxsched_module.cpp
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "State.hpp"
#include "Sim.hpp"
#include <chrono>
#include <string>
#include <vector>
#include <optional>

namespace py = pybind11;

// 辅助：把 C++ 结构转成 Python dict（字段名对齐你 Python 的 pydantic 模型）
static py::dict to_py(const GpuResource& g){
    py::dict d;
    d["id"]=g.id; d["gpu_name"]=g.gpu_name; d["gpu_memory"]=g.gpu_memory;
    d["performance_score"]=g.performance_score; d["compute_capability"]=g.compute_capability;
    d["is_shared"]=g.is_shared; d["status"]=g.status;
    d["created_at"]=std::chrono::duration_cast<std::chrono::milliseconds>(g.created_at.time_since_epoch()).count();
    d["updated_at"]=std::chrono::duration_cast<std::chrono::milliseconds>(g.updated_at.time_since_epoch()).count();
    return d;
}
static py::dict to_py(const ComputeRequest& r){
    auto tp_to_ms = [](auto tp){
        if (tp.time_since_epoch().count()==0) return int64_t(0);
        return std::chrono::duration_cast<std::chrono::milliseconds>(tp.time_since_epoch()).count();
    };
    py::dict d;
    d["id"]=r.id; d["task_description"]=r.task_description; d["required_memory"]=r.required_memory;
    d["estimated_duration"]=r.estimated_duration; d["priority"]=r.priority; d["status"]=r.status;
    d["assigned_gpu_id"]=r.assigned_gpu_id;
    d["created_at"]=tp_to_ms(r.created_at);
    d["started_at"]=tp_to_ms(r.started_at);
    d["completed_at"]=tp_to_ms(r.completed_at);
    return d;
}
static py::dict to_py(const PlatformStats& s){
    py::dict d;
    d["total_users"]=s.total_users; d["total_gpus"]=s.total_gpus;
    d["online_gpus"]=s.online_gpus; d["pending_requests"]=s.pending_requests;
    d["completed_requests"]=s.completed_requests;
    return d;
}

PYBIND11_MODULE(cxxsched, m /*, py::mod_gil_not_used() 可选 */) {
    m.doc() = "C++ scheduler bindings";

    // 启停模拟器（后台线程）
    m.def("start_simulator", [](){
        py::gil_scoped_release release;
        startSimulator(); // 已经是detach线程，不会阻塞
    });

    // 统计
    m.def("stats", [](){
        PlatformStats s;
        {
            py::gil_scoped_release release;
            s = State::instance().stats();
        }
        return to_py(s);  // 构造 py::dict 时必须持有 GIL（此时已恢复）
    });



    // 列表
    m.def("list_gpus", [](const std::string& q, const std::string& status){
        std::vector<GpuResource> v;
        {   // 仅这段释放 GIL
            py::gil_scoped_release release;
            v = State::instance().listGpus(q, status);
        }
        py::list out;                      // 这里已重新持有 GIL
        for (auto& g: v) out.append(to_py(g));
        return out;
    }, py::arg("q")="", py::arg("status")="");

    m.def("list_requests", [](const std::string& q, const std::string& status){
        std::vector<ComputeRequest> v;
        {
            py::gil_scoped_release release;
            v = State::instance().listRequests(q, status);
        }
        py::list out;
        for (auto& r: v) out.append(to_py(r));
        return out;
    }, py::arg("q")="", py::arg("status")="");


    // 创建 / 匹配 / 状态更新
    m.def("create_request", [](const std::string& desc,int mem,int est,const std::string& pri){
        ComputeRequest r;
        {
            py::gil_scoped_release release;
            r = State::instance().createRequest(desc, mem, est, pri);
        }
        return to_py(r);   // 持有 GIL
    });


    m.def("match_request", [](const std::string& rid, const std::string& gid) -> std::optional<py::dict> {
        ComputeRequest out; bool ok = false;
        {
            py::gil_scoped_release release;
            ok = State::instance().matchRequest(rid, gid, &out);
        }
        if (!ok) return std::nullopt;
        return to_py(out);   // 已持有 GIL
    });

    m.def("update_request_status", [](const std::string& rid, const std::string& st) -> std::optional<py::dict> {
        ComputeRequest out; bool ok = false;
        {
            py::gil_scoped_release release;
            ok = State::instance().updateRequestStatus(rid, st, &out);
        }
        if (!ok) return std::nullopt;
        return to_py(out);
    });

}
