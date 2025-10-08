#include <drogon/drogon.h>
#include <json/json.h>
#include "State.hpp"
#include "Utility.hpp"

using namespace drogon;

void registerRoutes() {
  // GET /stats
  app().registerHandler(
    "/stats",
    [](const HttpRequestPtr&,
       std::function<void (const HttpResponsePtr &)> &&cb) {
      auto s = State::instance().stats();
      Json::Value j;
      j["total_users"]=s.total_users;
      j["total_gpus"]=s.total_gpus;
      j["online_gpus"]=s.online_gpus;
      j["pending_requests"]=s.pending_requests;
      j["completed_requests"]=s.completed_requests;
      cb(HttpResponse::newHttpJsonResponse(j));
    },
    {Get}
  );

  // GET /gpus?q=&status=
  app().registerHandler(
    "/gpus",
    [](const HttpRequestPtr& req,
       std::function<void (const HttpResponsePtr &)> &&cb) {
      auto q  = req->getParameter("q");
      auto st = req->getParameter("status");
      auto vec = State::instance().listGpus(q, st);
      Json::Value arr(Json::arrayValue);
      for (auto& g : vec) arr.append(/* toJson(g) */ toJson(g));
      cb(HttpResponse::newHttpJsonResponse(arr));
    },
    {Get}
  );

  // GET /requests?q=&status=
  app().registerHandler(
    "/requests",
    [](const HttpRequestPtr& req,
       std::function<void (const HttpResponsePtr &)> &&cb) {
      auto q  = req->getParameter("q");
      auto st = req->getParameter("status");
      auto vec = State::instance().listRequests(q, st);
      Json::Value arr(Json::arrayValue);
      for (auto& r : vec) arr.append(/* toJson(r) */ toJson(r));
      cb(HttpResponse::newHttpJsonResponse(arr));
    },
    {Get}
  );

// POST /requests
app().registerHandler(
  "/requests",
  [](const HttpRequestPtr& req, std::function<void (const HttpResponsePtr &)> &&cb) {
    Json::CharReaderBuilder rb; Json::Value body; std::string errs;
    auto sv = req->getBody();
    std::unique_ptr<Json::CharReader> reader(rb.newCharReader());
    if (!reader->parse(sv.data(), sv.data()+sv.size(), &body, &errs)) {
      auto res = HttpResponse::newHttpResponse();
      res->setStatusCode(k400BadRequest);
      res->setBody("Invalid JSON: " + errs);
      cb(res);
      return;
    }
    auto desc = body["task_description"].asString();
    int  mem  = body["required_memory"].asInt();
    int  est  = body["estimated_duration"].asInt();
    auto pri  = body.isMember("priority") ? body["priority"].asString() : "normal";
    auto r = State::instance().createRequest(desc, mem, est, pri);
    cb(HttpResponse::newHttpJsonResponse(toJson(r)));
  },
  {Post}
);

// POST /requests/{rid}/match
app().registerHandler(
  "/requests/{rid}/match",
  [](const HttpRequestPtr& req, std::function<void (const HttpResponsePtr &)> &&cb, std::string rid) {
    Json::CharReaderBuilder rb; Json::Value body; std::string errs;
    auto sv = req->getBody();
    std::unique_ptr<Json::CharReader> reader(rb.newCharReader());
    if (!reader->parse(sv.data(), sv.data()+sv.size(), &body, &errs) || !body.isMember("gpu_id")) {
      auto res = HttpResponse::newHttpResponse();
      res->setStatusCode(k400BadRequest);
      res->setBody("gpu_id required");
      cb(res);
      return;
    }
    ComputeRequest out;
    bool ok = State::instance().matchRequest(rid, body["gpu_id"].asString(), &out);
    if (!ok) {
      auto res = HttpResponse::newHttpResponse();
      res->setStatusCode(k400BadRequest);
      res->setBody("匹配失败：GPU不可用或请求不存在");
      cb(res);
      return;
    }
    cb(HttpResponse::newHttpJsonResponse(toJson(out)));
  },
  {Post}
);

// POST /requests/{rid}/status
app().registerHandler(
  "/requests/{rid}/status",
  [](const HttpRequestPtr& req, std::function<void (const HttpResponsePtr &)> &&cb, std::string rid) {
    Json::CharReaderBuilder rb; Json::Value body; std::string errs;
    auto sv = req->getBody();
    std::unique_ptr<Json::CharReader> reader(rb.newCharReader());
    if (!reader->parse(sv.data(), sv.data()+sv.size(), &body, &errs) || !body.isMember("status")) {
      auto res = HttpResponse::newHttpResponse();
      res->setStatusCode(k400BadRequest);
      res->setBody("status required");
      cb(res);
      return;
    }
    ComputeRequest out;
    bool ok = State::instance().updateRequestStatus(rid, body["status"].asString(), &out);
    if (!ok) {
      auto res = HttpResponse::newHttpResponse();
      res->setStatusCode(k404NotFound);
      res->setBody("请求不存在");
      cb(res);
      return;
    }
    cb(HttpResponse::newHttpJsonResponse(toJson(out)));
  },
  {Post}
);

}
