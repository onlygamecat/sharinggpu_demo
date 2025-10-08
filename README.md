## 后端
### 1. python 后端

位于 `backend_py` 目录下
```
├── main.py 后端主程序
├── models.py 数据模型
├── scheduler_adapter_fixed.py 一个模拟的调度器，会生成一些固定的任务以展示
└── scheduler_adapter.py 一个模拟的调度器，会随机生成一些 GPU 任务并分配执行
```


安装相关的库
```
pip install fastapi uvicorn pydantic[dotenv] pynvml
```

运行后端
```bash
uvicorn main:app --reload --port 9000
```

### 2. cpp 后端

位于 `backend_cpp` 目录下

```
├── CMakeLists.txt
└── src
    ├── main.cpp
    ├── Routes.cpp
    ├── Sim.cpp 
    ├── Sim.hpp
    ├── State.cpp
    ├── State.hpp
    └── Utility.hpp

By GPT:

main.cpp（进程入口 / 框架启动）
负责进程启动、注册所有 HTTP 路由、设置全局中间件（例如 CORS 处理）、监听端口并运行事件循环。

Routes.cpp（HTTP 接口层 / 控制器）
用 drogon 注册 REST 路由：

GET /stats、GET /gpus、GET /requests

POST /requests、POST /requests/{rid}/match、POST /requests/{rid}/status
在这里把请求参数/JSON 解析出来，调用 State 的方法完成业务，再把结果用 Utility 序列化成 JSON 返回。
简单理解：Web 入口 + 参数校验 + 调用业务 + 组装响应。

State.hpp / State.cpp（核心状态与业务逻辑 / 单例）
持有并管理全部运行时数据：

GPU 列表、请求队列、计数统计等

提供查询与修改接口：listGpus()、listRequests()、createRequest()、matchRequest()、updateRequestStatus()、stats() …
同时负责必要的并发保护（如互斥锁）与时间戳更新。

Sim.hpp / Sim.cpp（后台仿真 / 定时任务）
独立线程或定时器周期性地产生模拟请求、尝试自动匹配 GPU，并在计时到期后把任务置为 completed（并释放显存）。

Utility.hpp（通用工具 / 序列化）
放置与业务解耦的工具函数，比如：

结构体与 JSON 互相转换的 toJson(const GpuResource&)、toJson(const ComputeRequest&)

时间点/字符串的转换小工具
让 Routes 层能方便地把 State 返回的对象转成 HTTP JSON 响应。
```

需要安装 Drogon, spdlog 库

Drogon 安装参考：
https://drogonframework.github.io/drogon-docs/#/CHN/CHN-02-%E5%AE%89%E8%A3%85

spdlog 安装：
```
sudo apt install -y libspdlog-dev
```

```bash
cd backend_cpp
mkdir build
cd build
cmake ..
make -j8
./gpu_backend
```

## 前端
选择一种后端启动后，进入 `webui` 目录，安装依赖并启动前端

```bash
npm i
npx vite --host 127.0.0.1 --port 5175
```