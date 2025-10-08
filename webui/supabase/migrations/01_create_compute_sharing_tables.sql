/*
# 创建算力共享平台数据库表结构

## 1. 概述
为局域网联想台式算力共享平台创建必要的数据库表结构，支持用户管理、GPU资源管理、算力请求和共享功能。

## 2. 新建表结构

### 2.1 profiles 表 - 用户档案
- `id` (uuid, 主键, 默认: gen_random_uuid())
- `user_id` (uuid, 外键关联 auth.users(id))
- `phone` (text, 唯一, 非空)
- `username` (text, 非空)
- `role` (text, 默认: 'user', 非空) - 用户角色: 'user', 'admin'
- `user_type` (text, 默认: 'both', 非空) - 用户类型: 'demander', 'supplier', 'both'
- `created_at` (timestamptz, 默认: now())

### 2.2 gpu_resources 表 - GPU资源
- `id` (uuid, 主键, 默认: gen_random_uuid())
- `owner_id` (uuid, 外键关联 profiles(id))
- `gpu_name` (text, 非空) - GPU型号名称
- `gpu_memory` (integer, 非空) - GPU显存大小(GB)
- `compute_capability` (text) - 计算能力
- `status` (text, 默认: 'offline', 非空) - 状态: 'online', 'offline', 'busy'
- `is_shared` (boolean, 默认: false) - 是否共享
- `performance_score` (integer, 默认: 0) - 性能评分
- `created_at` (timestamptz, 默认: now())
- `updated_at` (timestamptz, 默认: now())

### 2.3 compute_requests 表 - 算力请求
- `id` (uuid, 主键, 默认: gen_random_uuid())
- `requester_id` (uuid, 外键关联 profiles(id))
- `assigned_gpu_id` (uuid, 外键关联 gpu_resources(id), 可空)
- `task_description` (text, 非空) - 任务描述
- `required_memory` (integer, 非空) - 所需显存(GB)
- `estimated_duration` (integer, 非空) - 预估时长(分钟)
- `priority` (text, 默认: 'normal', 非空) - 优先级: 'low', 'normal', 'high'
- `status` (text, 默认: 'pending', 非空) - 状态: 'pending', 'matched', 'running', 'completed', 'failed'
- `created_at` (timestamptz, 默认: now())
- `started_at` (timestamptz, 可空)
- `completed_at` (timestamptz, 可空)

### 2.4 sharing_schedules 表 - 共享时段
- `id` (uuid, 主键, 默认: gen_random_uuid())
- `gpu_id` (uuid, 外键关联 gpu_resources(id))
- `day_of_week` (integer, 非空) - 星期几 (0-6, 0为周日)
- `start_time` (time, 非空) - 开始时间
- `end_time` (time, 非空) - 结束时间
- `is_active` (boolean, 默认: true) - 是否激活
- `created_at` (timestamptz, 默认: now())

## 3. 安全策略
- 所有表启用行级安全(RLS)
- 管理员拥有所有数据的完全访问权限
- 用户只能访问和修改自己的数据
- 首个注册用户自动成为管理员

## 4. 触发器
- 新用户注册时自动创建profile记录
- 首个用户自动获得admin角色
*/

-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  username text NOT NULL,
  role text DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  user_type text DEFAULT 'both' NOT NULL CHECK (user_type IN ('demander', 'supplier', 'both')),
  created_at timestamptz DEFAULT now()
);

-- 创建 gpu_resources 表
CREATE TABLE IF NOT EXISTS gpu_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  gpu_name text NOT NULL,
  gpu_memory integer NOT NULL,
  compute_capability text,
  status text DEFAULT 'offline' NOT NULL CHECK (status IN ('online', 'offline', 'busy')),
  is_shared boolean DEFAULT false,
  performance_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建 compute_requests 表
CREATE TABLE IF NOT EXISTS compute_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_gpu_id uuid REFERENCES gpu_resources(id) ON DELETE SET NULL,
  task_description text NOT NULL,
  required_memory integer NOT NULL,
  estimated_duration integer NOT NULL,
  priority text DEFAULT 'normal' NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'matched', 'running', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- 创建 sharing_schedules 表
CREATE TABLE IF NOT EXISTS sharing_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gpu_id uuid REFERENCES gpu_resources(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 启用行级安全
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpu_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE compute_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sharing_schedules ENABLE ROW LEVEL SECURITY;

-- 创建管理员检查函数
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = uid AND p.role = 'admin'
  );
$$;

-- profiles 表的安全策略
CREATE POLICY "管理员拥有完全访问权限" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的档案" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的档案" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- gpu_resources 表的安全策略
CREATE POLICY "管理员拥有GPU资源完全访问权限" ON gpu_resources
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看所有在线GPU资源" ON gpu_resources
  FOR SELECT USING (status = 'online' AND is_shared = true);

CREATE POLICY "用户可以管理自己的GPU资源" ON gpu_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = owner_id AND p.user_id = auth.uid()
    )
  );

-- compute_requests 表的安全策略
CREATE POLICY "管理员拥有算力请求完全访问权限" ON compute_requests
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以查看自己的算力请求" ON compute_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = requester_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以创建算力请求" ON compute_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = requester_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以更新自己的算力请求" ON compute_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = requester_id AND p.user_id = auth.uid()
    )
  );

-- sharing_schedules 表的安全策略
CREATE POLICY "管理员拥有共享时段完全访问权限" ON sharing_schedules
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "用户可以管理自己GPU的共享时段" ON sharing_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM gpu_resources gr
      JOIN profiles p ON p.id = gr.owner_id
      WHERE gr.id = gpu_id AND p.user_id = auth.uid()
    )
  );

-- 创建新用户处理函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  -- 判断 profiles 表里有多少用户
  SELECT COUNT(*) INTO user_count FROM profiles;

  -- 插入 profiles，首位用户给 admin 角色
  INSERT INTO profiles (id, user_id, phone, username, role)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'username', '用户' || substring(NEW.phone from 8)),
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END
  );

  RETURN NEW;
END;
$$;

-- 确保触发器绑定到 auth.users 表
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 插入一些示例GPU资源数据
INSERT INTO gpu_resources (owner_id, gpu_name, gpu_memory, compute_capability, status, is_shared, performance_score) 
SELECT 
  p.id,
  'NVIDIA RTX 4090',
  24,
  '8.9',
  'online',
  true,
  95
FROM profiles p 
WHERE p.role = 'admin'
LIMIT 1;

INSERT INTO gpu_resources (owner_id, gpu_name, gpu_memory, compute_capability, status, is_shared, performance_score) 
SELECT 
  p.id,
  'NVIDIA RTX 3080',
  10,
  '8.6',
  'online',
  true,
  85
FROM profiles p 
WHERE p.role = 'admin'
LIMIT 1;

INSERT INTO gpu_resources (owner_id, gpu_name, gpu_memory, compute_capability, status, is_shared, performance_score) 
SELECT 
  p.id,
  'NVIDIA RTX 3070',
  8,
  '8.6',
  'offline',
  false,
  75
FROM profiles p 
WHERE p.role = 'admin'
LIMIT 1;