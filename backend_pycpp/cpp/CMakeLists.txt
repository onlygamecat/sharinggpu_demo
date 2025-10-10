cmake_minimum_required(VERSION 3.15)
project(cxxsched LANGUAGES CXX)

# --- 选择正确的 Python 解释器（很重要，确保与你的 venv 匹配） ---
# 配置时可传入: cmake -DPython_EXECUTABLE=$(which python) ..
# 若没传，pybind11 也会自己找，但建议显式指定。
set(Python_EXECUTABLE "" CACHE FILEPATH "Path to Python executable")

# --- 编译选项 ---
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)  # 生成可被 Python import 的模块

# --- pybind11 ---
find_package(pybind11 CONFIG REQUIRED)   # 建议用 CONFIG 包
# 如果你的发行版不是 CONFIG 包，也可用普通 find_package(pybind11 REQUIRED)

# --- 源码/头文件 ---
# 假设 State.hpp / Sim.hpp / Utility.hpp 与本目录同级
include_directories(${CMAKE_CURRENT_SOURCE_DIR})

# --- 生成 Python 扩展模块 ---
# pybind11_add_module 会自动处理平台后缀与命名（.so/.pyd）
pybind11_add_module(cxxsched
  cxxsched_module.cpp
  State.cpp
  Sim.cpp
)

# 如果需要其它库，按需 target_link_libraries(cxxsched PRIVATE xxx)
# 这里我们不链接 drogon，因为 HTTP 由 Python FastAPI 负责

# --- （可选）精简体积 ---
# 仅在 Release 时 strip
if(NOT MSVC)
  pybind11_strip(cxxsched)
endif()

# --- 构建后复制到 Python 目录，方便 import ---
# 假设 Python 目录是 cpp/../py
set(PY_DST_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../py)

add_custom_command(TARGET cxxsched POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E make_directory ${PY_DST_DIR}
  COMMAND ${CMAKE_COMMAND} -E copy $<TARGET_FILE:cxxsched> ${PY_DST_DIR}/
  COMMENT "Copying cxxsched extension to ${PY_DST_DIR}"
)
