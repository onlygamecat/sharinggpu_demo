#include <drogon/drogon.h>
#include <unordered_set>
#include <string>
#include "Sim.hpp"

void registerRoutes();

int main()
{
  using namespace drogon;

  // 允许的前端 Origin 白名单
  static const std::unordered_set<std::string> kAllow = {
      "http://localhost:5175", "http://127.0.0.1:5175",
      "http://localhost:5180", "http://127.0.0.1:5180",
      "http://localhost:3000", "http://127.0.0.1:3000"};

  // 预检 OPTIONS：命中白名单则回显该 Origin，并放行
  app().registerPreRoutingAdvice(
      [=](const HttpRequestPtr &req,
          AdviceCallback &&cb,
          AdviceChainCallback &&next)
      {
        if (req->method() == Options)
        {
          auto origin = req->getHeader("Origin");
          auto resp = HttpResponse::newHttpResponse();

          if (!origin.empty())
            resp->addHeader("Vary", "Origin");
          if (!origin.empty() && kAllow.count(origin))
          {
            resp->addHeader("Access-Control-Allow-Origin", origin);
          }
          else
          {
            // 本地开发也可直接用 *（不带凭证时）
            resp->addHeader("Access-Control-Allow-Origin", "*");
          }
          resp->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
          resp->addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
          resp->addHeader("Access-Control-Max-Age", "86400");
          resp->setStatusCode(k204NoContent);
          cb(resp);
          return;
        }
        next(); // 非预检继续走路由
      });

  // 所有实际响应统一加 CORS 头
  app().registerPostHandlingAdvice(
      [=](const HttpRequestPtr &req, const HttpResponsePtr &resp)
      {
        auto origin = req->getHeader("Origin");
        if (!origin.empty())
          resp->addHeader("Vary", "Origin");
        if (!origin.empty() && kAllow.count(origin))
        {
          resp->addHeader("Access-Control-Allow-Origin", origin);
        }
        else
        {
          resp->addHeader("Access-Control-Allow-Origin", "*");
        }
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp->addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      });

  registerRoutes(); // 注册 /stats /gpus /requests ...
  startSimulator(); // 启动模拟器，可将本行注释掉，则不启动模拟器
  app().addListener("0.0.0.0", 9000).run();
}
