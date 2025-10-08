cmake_minimum_required(VERSION 3.16)
project(gpu_backend CXX)
set(CMAKE_CXX_STANDARD 20)


find_package(Drogon REQUIRED)
find_package(spdlog CONFIG REQUIRED)
find_package(jsoncpp CONFIG REQUIRED)

add_executable(gpu_backend
  src/main.cpp
  src/State.hpp src/State.cpp
  src/Routes.cpp
  src/Sim.hpp src/Sim.cpp
)
target_link_libraries(gpu_backend PRIVATE
  Drogon::Drogon
  spdlog::spdlog
  jsoncpp_lib
)
