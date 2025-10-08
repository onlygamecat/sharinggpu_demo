// Utility.hpp
#pragma once
#include <json/json.h>
#include <chrono>
#include <ctime>
#include <string>

// 你自己的头，里面声明了 GpuResource / ComputeRequest / PlatformStats
#include "State.hpp"

// 统一个别名，便于书写
using TimePoint = std::chrono::system_clock::time_point;

// 把 time_point 转成 ISO8601（UTC）字符串：2025-01-02T03:04:05Z
inline std::string toIso8601(const TimePoint &tp) {
    if (tp.time_since_epoch().count() == 0) {
        // 默认构造的 time_point（“零”）当成“未设置”
        return "";
    }
    std::time_t t = std::chrono::system_clock::to_time_t(tp);
    std::tm tm{};
#if defined(_WIN32)
    gmtime_s(&tm, &t);
#else
    gmtime_r(&t, &tm);
#endif
    char buf[32];
    std::strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tm);
    return std::string(buf);
}

// --------- 这里按你的真实结构体字段来改名即可 ---------

inline Json::Value toJson(const GpuResource &g) {
    Json::Value j;
    j["id"]                 = g.id;
    j["gpu_name"]           = g.gpu_name;
    j["gpu_memory"]         = g.gpu_memory;
    j["performance_score"]  = g.performance_score;
    if (!g.compute_capability.empty())
        j["compute_capability"] = g.compute_capability;
    j["is_shared"]          = g.is_shared;
    j["status"]             = g.status;

    const auto created = toIso8601(g.created_at);
    const auto updated = toIso8601(g.updated_at);
    if (!created.empty()) j["created_at"] = created;
    if (!updated.empty()) j["updated_at"] = updated;

    return j;
}

inline Json::Value toJson(const ComputeRequest &r) {
    Json::Value j;
    j["id"]                 = r.id;
    j["task_description"]   = r.task_description;
    j["required_memory"]    = r.required_memory;
    j["estimated_duration"] = r.estimated_duration;
    j["priority"]           = r.priority;
    j["status"]             = r.status;
    if (!r.assigned_gpu_id.empty())
        j["assigned_gpu_id"] = r.assigned_gpu_id;

    const auto created   = toIso8601(r.created_at);
    const auto started   = toIso8601(r.started_at);
    const auto completed = toIso8601(r.completed_at);
    if (!created.empty())   j["created_at"]   = created;
    if (!started.empty())   j["started_at"]   = started;
    if (!completed.empty()) j["completed_at"] = completed;
    return j;
}

inline Json::Value toJson(const PlatformStats &s) {
    Json::Value j;
    j["total_users"]       = s.total_users;
    j["total_gpus"]        = s.total_gpus;
    j["online_gpus"]       = s.online_gpus;
    j["pending_requests"]  = s.pending_requests;
    j["completed_requests"]= s.completed_requests;
    return j;
}
