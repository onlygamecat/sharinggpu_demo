#include "Sim.hpp"
#include "State.hpp"
#include <thread>
#include <random>
#include <chrono>

void startSimulator(){
  std::thread([]{
    std::mt19937 rng{std::random_device{}()};
    std::uniform_int_distribution<int> memPick(0,3);
    int memOpts[4]={4,8,12,16};
    std::uniform_int_distribution<int> estPick(0,4);
    int estOpts[5]={15,30,45,60,90};
    std::uniform_int_distribution<int> prPick(0,2);
    const char* priOpts[3]={"low","normal","high"};

    while(true){
      // 1) 生成请求
      auto r = State::instance().createRequest("自动生成：作业", memOpts[memPick(rng)], estOpts[estPick(rng)], priOpts[prPick(rng)]);

      // 2) 简单自动调度：找可用显存最多的 GPU
      auto gpus = State::instance().listGpus("", "all");
      std::string chosen;
      int bestFree=-1;
      for(auto& g: gpus){
        int f = State::instance().freeMemOf(g.id);
        if (g.is_shared && f >= r.required_memory && f > bestFree){ bestFree=f; chosen=g.id; }
      }
      if (!chosen.empty()){
        ComputeRequest out;
        State::instance().matchRequest(r.id, chosen, &out);
        // 3) 随机一段时间后自动完成
        std::thread([rid=r.id]{
          std::this_thread::sleep_for(std::chrono::seconds(20 + (std::rand()%25)));
          ComputeRequest dummy;
          State::instance().updateRequestStatus(rid, "completed", &dummy);
        }).detach();
      }
      std::this_thread::sleep_for(std::chrono::seconds(10));
    }
  }).detach();
}
