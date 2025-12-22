# AWS 部署完整指南

这是一份面向初学者的 AWS 部署指南，手把手教你如何将 Koa MPA 项目从阿里云迁移到 AWS。

---

## 📋 准备工作清单

在开始之前，请确保你已经：

- [ ] 注册了 AWS 账号
- [ ] 有一张信用卡用于 AWS 验证（免费套餐也需要）
- [ ] 安装了 Node.js 和 Yarn
- [ ] 项目代码已经在本地运行成功

---

## 🎯 第一步：创建 VPC 和网络架构

### 1.1 登录 AWS 控制台

1. 访问 https://console.aws.amazon.com/
2. 选择区域（建议：东京 ap-northeast-1 或新加坡 ap-southeast-1）
3. 在右上角确认选择的区域

### 1.2 创建 VPC

⚠️ **重要提示**：由于 AWS "VPC 和更多" 向导在选择 3 个可用区时，强制要求公有子网为 0 或 3，无法选择 1 个。因此我们需要**手动创建** VPC 架构。

#### 步骤 1: 创建 VPC

1. 在搜索栏输入 "VPC" 并进入 VPC 控制台
2. 点击左侧菜单 **"您的 VPC"** → **"创建 VPC"**
3. ⚠️ 选择 **"仅 VPC"**（不选择 "VPC 和更多"）
4. 配置如下：

```yaml
名称标签: koa-mpa-vpc
IPv4 CIDR 块: 10.0.0.0/16
IPv6 CIDR 块: 无 IPv6 CIDR 块
租期: 默认
```

5. 点击 **"创建 VPC"**
6. 记录 VPC ID（例如：vpc-xxxxxxxxxxxxxxxxx）

#### 步骤 2: 创建 Internet Gateway (IGW)

1. 左侧菜单点击 **"Internet 网关"** → **"创建 Internet 网关"**
2. 配置：
   ```yaml
   名称标签: koa-mpa-igw
   ```
3. 点击 **"创建 Internet 网关"**
4. 创建后，点击 **"操作"** → **"附加到 VPC"**
5. 选择刚创建的 `koa-mpa-vpc`，点击 **"附加 Internet 网关"**

#### 步骤 3: 创建子网

创建 4 个子网（1 个公有 + 3 个私有）：

**3.1 创建公有子网**

1. 左侧菜单点击 **"子网"** → **"创建子网"**
2. 配置：
   ```yaml
   VPC ID: 选择 koa-mpa-vpc
   子网名称: koa-mpa-public-subnet-1a
   可用区: ap-northeast-1a
   IPv4 CIDR 块: 10.0.0.0/24
   ```
3. 点击 **"创建子网"**

**3.2 创建私有子网 1**

1. 再次点击 **"创建子网"**
2. 配置：
   ```yaml
   VPC ID: 选择 koa-mpa-vpc
   子网名称: koa-mpa-private-subnet-1a
   可用区: ap-northeast-1a
   IPv4 CIDR 块: 10.0.1.0/24
   ```
3. 点击 **"创建子网"**

**3.3 创建私有子网 2**

1. 再次点击 **"创建子网"**
2. 配置：
   ```yaml
   VPC ID: 选择 koa-mpa-vpc
   子网名称: koa-mpa-private-subnet-1c
   可用区: ap-northeast-1c
   IPv4 CIDR 块: 10.0.2.0/24
   ```
3. 点击 **"创建子网"**

**3.4 创建私有子网 3**

1. 再次点击 **"创建子网"**
2. 配置：
   ```yaml
   VPC ID: 选择 koa-mpa-vpc
   子网名称: koa-mpa-private-subnet-1d
   可用区: ap-northeast-1d
   IPv4 CIDR 块: 10.0.3.0/24
   ```
3. 点击 **"创建子网"**

#### 步骤 4: 为公有子网分配弹性 IP（用于 NAT 网关）

1. 左侧菜单点击 **"弹性 IP"** → **"分配弹性 IP 地址"**
2. 配置：
   ```yaml
   网络边界组: ap-northeast-1（默认）
   ```
3. 点击 **"分配"**
4. 记录分配的弹性 IP 地址

#### 步骤 5: 创建 NAT 网关

1. 左侧菜单点击 **"NAT 网关"** → **"创建 NAT 网关"**
2. 配置：
   ```yaml
   名称: koa-mpa-nat-gw
   子网: 选择 koa-mpa-public-subnet-1a（公有子网）
   连接类型: 公有
   弹性 IP 分配 ID: 选择刚才分配的弹性 IP
   ```
3. 点击 **"创建 NAT 网关"**
4. ⏱️ 等待 1-2 分钟，直到状态变为 **"可用"**

#### 步骤 6: 创建路由表

**6.1 创建公有路由表**

1. 左侧菜单点击 **"路由表"** → **"创建路由表"**
2. 配置：
   ```yaml
   名称: koa-mpa-public-rtb
   VPC: koa-mpa-vpc
   ```
3. 点击 **"创建路由表"**
4. 选择刚创建的路由表，点击 **"路由"** 标签页 → **"编辑路由"**
5. 点击 **"添加路由"**：
   ```yaml
   目标: 0.0.0.0/0
   目标: 选择 Internet Gateway → koa-mpa-igw
   ```
6. 点击 **"保存更改"**
7. 点击 **"子网关联"** 标签页 → **"编辑子网关联"**
8. 选择 `koa-mpa-public-subnet-1a`，点击 **"保存关联"**

**6.2 创建私有路由表**

1. 再次点击 **"创建路由表"**
2. 配置：
   ```yaml
   名称: koa-mpa-private-rtb
   VPC: koa-mpa-vpc
   ```
3. 点击 **"创建路由表"**
4. 选择刚创建的路由表，点击 **"路由"** 标签页 → **"编辑路由"**
5. 点击 **"添加路由"**：
   ```yaml
   目标: 0.0.0.0/0
   目标: 选择 NAT Gateway → koa-mpa-nat-gw
   ```
6. 点击 **"保存更改"**
7. 点击 **"子网关联"** 标签页 → **"编辑子网关联"**
8. 选择所有 3 个私有子网：
   - `koa-mpa-private-subnet-1a`
   - `koa-mpa-private-subnet-1c`
   - `koa-mpa-private-subnet-1d`
9. 点击 **"保存关联"**

#### 步骤 7: （可选）创建 VPC 终端节点 - S3 网关

1. 左侧菜单点击 **"终端节点"** → **"创建终端节点"**
2. 配置：
   ```yaml
   名称标签: koa-mpa-s3-endpoint
   服务类别: AWS 服务
   服务: com.amazonaws.ap-northeast-1.s3 (类型: Gateway)
   VPC: koa-mpa-vpc
   路由表: 选择 koa-mpa-private-rtb
   ```
3. 点击 **"创建终端节点"**

✅ **完成！** VPC 架构创建完成，包含：

- 1 个 VPC
- 1 个公有子网（ap-northeast-1a）
- 3 个私有子网（跨 3 个可用区）
- 1 个 NAT 网关（在公有子网）
- 对应的路由表配置

### 1.3 记录创建的资源 ID

VPC 创建完成后，记录以下信息（后面会用到）：

```
VPC ID: vpc-XXXXXXXXXXX
公有子网 ID: subnet-XXXXXXXXXXX (ap-XXXXXXXXXXX-1a)
私有子网 1 ID: subnet-XXXXXXXXXXX (ap-XXXXXXXXXXX-1a)
私有子网 2 ID: subnet-XXXXXXXXXXX (ap-XXXXXXXXXXX-1c)
私有子网 3 ID: subnet-XXXXXXXXXXX (ap-XXXXXXXXXXX-1d)
```

**如何查找这些 ID：**

- 在 VPC 控制台左侧菜单点击 **"子网"**
- 筛选条件选择你的 VPC ID
- 记下所有子网的 ID（注意区分公有子网和私有子网）

---

## 🎯 第二步：配置 Supabase Serverless 数据库

⚠️ **重要变更**：根据课程要求，我们使用 **Supabase** 作为 Serverless 数据库集群，而不是 AWS RDS。

**Supabase 优势**：

- ✅ 真正的 Serverless 数据库（自动扩展）
- ✅ 自带 Web 管理界面（替代 Navicat）
- ✅ PostgreSQL 数据库（Prisma 完全支持）
- ✅ 自动读写分离和连接池
- ✅ 免费套餐额度充足

**📖 详细配置步骤**：请查看 [SUPABASE-SETUP.md](./SUPABASE-SETUP.md)

**快速开始**：

1. 访问 https://supabase.com 注册账号
2. 创建新项目，选择 Tokyo 区域
3. 获取数据库连接字符串
4. 配置 Prisma 使用 PostgreSQL
5. 运行数据库迁移

**完成后记录以下信息**：

```
Supabase Project URL: https://xxxxxxxxxxxxx.supabase.co
Database Host: db.xxxxxxxxxxxxx.supabase.co
Database Password: ******************
CONNECTION_STRING: postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

---

## 🎯 第三步：创建 Aurora PostgreSQL 数据库（可选）

⚠️ **重要说明**：

- 推荐使用 Supabase（成本更低，配置更简单，参见上方第二步）
- 如需使用 AWS 原生数据库或学习 Aurora，可按此步骤操作
- Aurora 无免费套餐，持续运行约 $75-85/月

### 2.1 创建数据库安全组

1. 在 VPC 控制台，左侧菜单点击 **"安全组"**
2. 点击 **"创建安全组"**
3. 配置：

```yaml
基本详细信息:
  安全组名称: koa-mpa-aurora-sg
  描述: Security group for Aurora PostgreSQL database
  VPC: 选择你刚创建的 koa-mpa-vpc

入站规则:
  点击 "添加规则"
  - 类型: PostgreSQL
  - 协议: TCP
  - 端口范围: 5432
  - 源: 自定义 → 10.0.0.0/16（允许整个 VPC 访问）
  - 描述: Allow PostgreSQL access from VPC

出站规则:
  保持默认（允许所有出站流量）
```

4. 点击 **"创建安全组"**
5. 记录安全组 ID: `sg-XXXXXXXXXXXXXXX`

### 2.2 创建 Aurora PostgreSQL 数据库集群

1. 在搜索栏输入 "RDS" 并进入 RDS 控制台
2. 点击 **"创建数据库"**
3. 配置：

**引擎选项**

```yaml
引擎类型: Amazon Aurora
版本: Aurora (PostgreSQL Compatible)
Edition: Amazon Aurora PostgreSQL-Compatible Edition
引擎版本: Aurora PostgreSQL 16.6 或最新稳定版（兼容 PostgreSQL 16.x）
```

**模板**

```yaml
选择: 开发/测试
⚠️ 注意：Aurora 不支持免费套餐，建议选择 Serverless v2 以降低成本
```

**可用性和持久性**

```yaml
选择: 不创建 Aurora 副本
说明: 单实例部署，适合开发/测试环境，降低成本
```

**设置**

```yaml
数据库集群标识符: koa-mpa-aurora-cluster
凭证设置:
  主用户名: postgres（Aurora PostgreSQL 默认）
  主密码: 创建一个强密码（至少 8 个字符，包含大小写字母和数字）
  确认密码: 再次输入密码

⚠️ 重要：请记住这个密码，稍后配置时需要用到！
```

**实例配置**

```yaml
数据库实例类:
  选择: Serverless v2（推荐，按需扩展）
  或选择: db.t4g.medium（Provisioned 最小实例）

如果选择 Serverless v2:
  最小 ACU: 0（成本优化）使用select 1 来激活
  最大 ACU: 1（开发/测试环境）

⚠️ ACU (Aurora Capacity Unit): 1 ACU = 2GB RAM + 对应的 CPU
```

**存储**

```yaml
⚠️ Aurora 存储自动管理，无需手动配置
- 存储类型: Aurora 标准（自动）
- 自动扩展: 从 10 GiB 开始，根据需要自动扩展
- 按实际使用量计费
```

**连接**

```yaml
计算资源: 不连接到 EC2 计算资源

网络类型: IPv4
虚拟私有云 (VPC): koa-mpa-vpc
数据库子网组: 自动创建（Aurora 会创建跨 3 个可用区的子网组）
公开访问: 否 ⚠️ 非常重要！
VPC 安全组:
  - 删除默认安全组
  - 选择现有: koa-mpa-rds-sg
可用区: 无首选项

⚠️ 注意：Aurora PostgreSQL 默认端口是 5432（不是 MySQL 的 3306）
```

**数据库身份验证**

```yaml
数据库身份验证选项: 密码身份验证
```

**其他配置**

```yaml
初始数据库名称: postgres ⚠️ 推荐使用默认名称
或自定义: koa_mpa

数据库选项:
  数据库集群参数组: default.aurora-postgresql16
  数据库参数组: default.aurora-postgresql16

备份:
  启用自动备份: 是
  备份保留期: 7 天
  备份时段: 无首选项
  复制标签到快照: 是

加密:
  启用加密: 是（使用默认 AWS KMS 密钥）

监控:
  启用性能洞察: 是（推荐，7 天免费保留）
  性能洞察保留期: 7 天（免费）
  启用增强监控: 否（可选，需要额外费用）

维护:
  启用自动次要版本升级: 是
  维护时段: 无首选项

删除保护:
  启用删除保护: 是 ⚠️ 防止误删除
```

4. 点击 **"创建数据库"**
5. ⏱️ 等待 5-10 分钟，直到状态变为 **"可用"**

### 2.3 获取 Aurora 连接信息

数据库集群创建完成后：

1. 在 RDS 控制台点击 **"数据库"**，找到你的集群 `koa-mpa-aurora-cluster`
2. 点击集群名称，在 **"连接性和安全性"** 标签页，记录：

```
写入器终端节点（Writer endpoint）: koa-mpa-aurora-cluster.cluster-XXXXXXXXXXXX.ap-northeast-1.rds.amazonaws.com
读取器终端节点（Reader endpoint）: koa-mpa-aurora-cluster.cluster-ro-XXXXXXXXXXXX.ap-northeast-1.rds.amazonaws.com
端口: 5432

⚠️ 注意：
- Writer endpoint: 用于读写操作
- Reader endpoint: 仅用于读取操作（如果有只读副本）
- 通常使用 Writer endpoint 即可
```

---

## 🎯 第三步：创建 Lambda 安全组

### 3.1 创建安全组

1. 回到 VPC 控制台 → **"安全组"**
2. 点击 **"创建安全组"**
3. 配置：

```yaml
基本详细信息:
  安全组名称: koa-mpa-lambda-sg
  描述: Security group for Lambda functions
  VPC: koa-mpa-vpc

入站规则:
  无（Lambda 不需要入站连接）

出站规则:
  点击 "添加规则"
  - 类型: 全部流量
  - 协议: 全部
  - 端口范围: 全部
  - 目标: 0.0.0.0/0
  - 描述: Allow all outbound traffic
```

4. 点击 **"创建安全组"**
5. 记录安全组 ID: `sg-xxxxxxxxxxxxxxxxx`

### 3.2 更新 Aurora 安全组（允许 Lambda 访问）

1. 回到 Aurora 安全组 `koa-mpa-aurora-sg`
2. 点击 **"编辑入站规则"**
3. 修改现有的 PostgreSQL 规则：

```yaml
类型: PostgreSQL
协议: TCP
端口: 5432
源:
  - 自定义 → koa-mpa-lambda-sg（选择 Lambda 安全组）
  或
  - 自定义 → 10.0.0.0/16（允许整个 VPC）
描述: Allow Lambda to access Aurora PostgreSQL
```

4. 点击 **"保存规则"**

---

## 🎯 第四步：配置项目连接 Aurora PostgreSQL

### 4.1 更新环境变量配置

打开项目根目录下的 `.env.aws` 文件，更新以下内容：

```bash
NODE_ENV=production
PORT=8082
LOG_LEVEL=error

# Aurora PostgreSQL 连接字符串
# 使用 Writer endpoint 进行读写操作
DATABASE_URL="postgresql://postgres:你的数据库密码@koa-mpa-aurora-cluster.cluster-XXXXXXXXXXXXXX.ap-northeast-1.rds.amazonaws.com:5432/postgres?schema=public&connection_limit=5"

# 可选：如果需要直连（用于 Prisma Migrate）
DIRECT_URL="postgresql://postgres:你的数据库密码@koa-mpa-aurora-cluster.cluster-XXXXXXXXXXXXXX.ap-northeast-1.rds.amazonaws.com:5432/postgres"
```

**需要替换：**

1. `你的数据库密码` → 第二步创建 Aurora 时设置的密码
2. `koa-mpa-aurora-cluster.cluster-xxxxxxxxxxxxx.ap-northeast-1.rds.amazonaws.com` → 你的 Aurora Writer endpoint
3. `postgres` → 数据库名称（如果在创建时自定义为 koa_mpa，则改为 koa_mpa）

**连接字符串参数说明：**

- `schema=public`: 使用 public schema（PostgreSQL 默认）
- `connection_limit=5`: Lambda 环境建议限制连接数

### 4.2 测试数据库连接

**注意：** 由于 Aurora 在私有子网中，本地无法直接连接。你有两个选择：

**选项 A：临时开启公开访问（仅用于测试）**

1. 在 RDS 控制台，选择你的 Aurora 集群 `koa-mpa-aurora-cluster`
2. 点击 **"修改"**
3. 找到 **"连接"** → **"公开访问"**，改为 **"是"**
4. 点击 **"继续"** → **"立即应用"**
5. 在 `koa-mpa-aurora-sg` 安全组添加你的 IP：
   - 类型: PostgreSQL
   - 端口: 5432
   - 源: 我的 IP
6. 运行测试：
   ```bash
   cp .env.aws .env
   npx prisma db pull  # 测试连接并拉取schema
   npx prisma studio   # 打开数据库管理界面
   ```
7. 测试完成后，记得将 "公开访问" 改回 **"否"**

**选项 B：跳过测试，直接部署（推荐）**

如果你不想临时开启公开访问，可以直接进行部署，Lambda 在 VPC 内可以正常访问 Aurora。

---

## 🎯 第五步：运行数据库迁移

### 5.1 （可选）本地测试迁移

如果你在第四步选择了选项 A（开启了公开访问），可以本地运行迁移：

```bash
# 使用 AWS 环境变量
cp .env.aws .env

# 生成 Prisma 客户端
yarn prisma:generate

# 运行迁移（创建表结构）
yarn prisma:migrate:deploy

# （可选）查看数据库
yarn prisma:studio
```

### 5.2 或者在 Lambda 部署后运行迁移

如果跳过了本地测试，可以在部署 Lambda 后通过 Lambda 函数运行迁移（第六步会说明）。

---

## 🎯 第六步：部署到 AWS Lambda

### 6.1 安装 AWS 工具

```bash
# 安装 AWS CLI
brew install awscli

# 安装 SAM CLI
brew install aws-sam-cli

# 验证安装
aws --version
sam --version
```

### 6.2 配置 AWS 凭证

#### 6.2.1 创建 IAM 用户

1. 在 AWS 控制台搜索 "IAM"
2. 左侧菜单点击 **"用户"** → **"创建用户"**
3. 配置：
   ```yaml
   用户名: koa-mpa-deployer
   AWS 凭证类型: 访问密钥 - 编程访问
   ```
4. 点击 **"下一步：权限"**
5. 点击 **"直接附加现有策略"**
6. 搜索并选择以下策略：
   - `AdministratorAccess`（生产环境建议使用更细粒度的权限）
7. 点击 **"下一步"** → **"创建用户"**
8. ⚠️ **重要：** 下载或记录 **访问密钥 ID** 和 **秘密访问密钥**（只显示一次）

#### 6.2.2 配置 AWS CLI

```bash
aws configure

# 输入以下信息：
AWS Access Key ID: 你的访问密钥 ID
AWS Secret Access Key: 你的秘密访问密钥
Default region name: ap-northeast-1（或你选择的区域）
Default output format: json
```

### 6.3 更新 template.yaml 配置

打开 `template.yaml` 文件，更新以下内容：

```yaml
# 第 60-66 行：VpcConfig
VpcConfig:
  SubnetIds:
    - subnet-xxxxxxxx # 替换为私有子网 1 ID
    - subnet-yyyyyyyy # 替换为私有子网 2 ID
    - subnet-zzzzzzzz # 替换为私有子网 3 ID
  SecurityGroupIds:
    - sg-xxxxxxxxx # 替换为 koa-mpa-lambda-sg ID

# 第 68-74 行：Environment Variables
Environment:
  Variables:
    NODE_ENV: production
    PORT: 8082
    LOG_LEVEL: error
    DATABASE_URL: "postgresql://postgres:你的密码@koa-mpa-aurora-cluster.cluster-xxxxx.ap-northeast-1.rds.amazonaws.com:5432/postgres?schema=public&connection_limit=5"
```

### 6.4 构建项目

```bash
# 清理旧的构建文件
rm -rf dist/ .aws-sam/ layer/

# 构建 TypeScript
yarn build

# 准备 Lambda Layer（依赖包）
mkdir -p layer/nodejs
cp package.json layer/nodejs/
cd layer/nodejs
yarn install --production --frozen-lockfile
cd ../..

# 复制静态资源
cp -r views dist/
cp -r assets dist/
```

### 6.5 使用 SAM 部署

```bash
# 构建 SAM 应用
sam build --skip-pull-image

# 首次部署（引导式）
sam deploy --guided

# 按照提示输入：
Stack Name: koa-mpa-stack
AWS Region: ap-northeast-1（或你的区域）
Confirm changes before deploy: Y
Allow SAM CLI IAM role creation: Y
Disable rollback: N
KoaFunction has no authentication: Y
Save arguments to configuration file: Y
SAM configuration file: samconfig.toml
SAM configuration environment: default

# ⏱️ 等待 5-10 分钟部署完成
```

### 6.6 获取 API 地址

部署成功后，终端会显示：

```
Outputs:
  ApiEndpoint: https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev
  FunctionArn: arn:aws:lambda:ap-northeast-1:xxxxxxxxxxxx:function:koa-mpa-stack-KoaFunction-xxxxx
```

记录 `ApiEndpoint`，这就是你的应用访问地址！

### 6.7 运行数据库迁移

部署成功后，**必须先运行数据库迁移**创建表结构，否则 API 无法正常工作。

```bash
# 1. 查看部署输出，获取 MigrateFunctionName
sam list stack-outputs --stack-name koa-mpa-stack --region ap-northeast-1

# 2. 运行迁移 Lambda 函数
aws lambda invoke \
    --function-name koa-mpa-stack-MigrateFunction-<你的后缀> \
    --region ap-northeast-1 \
    output.json && cat output.json

# 成功输出示例：
# {"statusCode":200,"body":"{\"success\":true,\"message\":\"Migration completed successfully\",\"tables\":[\"_prisma_migrations\",\"form_data\",\"sessions\",\"users\"]}"}
```

### 6.8 测试部署

```bash
# 测试首页
curl https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/

# 测试 API
curl https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/api/list

# 测试创建用户
curl -X POST https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/users/create \
  -H "Content-Type: application/json" \
  -d '{"githubId": "test123", "username": "testuser", "email": "test@test.com"}'

# 或在浏览器中打开
open https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev
```

---

## 🎯 第七步：数据迁移（可选）

如果你需要将其他数据库的数据迁移到 Aurora PostgreSQL：

### 7.1 从源数据库导出数据

**从 PostgreSQL 导出：**

```bash
# 使用 pg_dump 导出
pg_dump -h 源数据库地址 \
  -U 用户名 \
  -d 数据库名 \
  -f backup.sql

# 或导出为自定义格式（推荐，支持并行恢复）
pg_dump -h 源数据库地址 \
  -U 用户名 \
  -d 数据库名 \
  -Fc \
  -f backup.dump
```

**从 MySQL 迁移到 PostgreSQL：**

如果源数据库是 MySQL，需要使用迁移工具：

- AWS Database Migration Service (DMS)
- pgloader
- 或手动转换 schema

### 7.2 导入到 Aurora PostgreSQL

由于 Aurora 在私有子网，你需要：

**选项 A：临时开启公开访问**

```bash
# 确保 Aurora 公开访问已开启（参考第四步）

# 使用 psql 导入 SQL 文件
psql -h koa-mpa-aurora-cluster.cluster-xxxxx.ap-northeast-1.rds.amazonaws.com \
  -U postgres \
  -d postgres \
  -f backup.sql

# 或导入自定义格式（支持并行）
pg_restore -h koa-mpa-aurora-cluster.cluster-xxxxx.ap-northeast-1.rds.amazonaws.com \
  -U postgres \
  -d postgres \
  -j 4 \
  backup.dump
```

**选项 B：通过 EC2 堡垒机**

1. 创建一个 EC2 实例在公有子网
2. 安装 PostgreSQL 客户端工具
3. 上传 backup 文件到 EC2
4. 从 EC2 连接 Aurora 并导入

---

## 🔧 常见问题排查

### 1. Lambda 无法连接 Aurora

**检查清单：**

- [ ] Lambda 是否在正确的私有子网中
- [ ] Lambda 安全组是否允许出站流量
- [ ] Aurora 安全组是否允许来自 Lambda 安全组的入站流量（端口 5432）
- [ ] DATABASE_URL 是否正确（PostgreSQL 格式）
- [ ] Aurora 集群状态是否为 "可用"
- [ ] 数据库名称是否正确（默认是 postgres）

### 2. SSL/TLS 连接错误

**错误信息：**

```
no pg_hba.conf entry for host ... no encryption
Error opening a TLS connection: unable to get local issuer certificate
```

**原因：** Aurora PostgreSQL 默认要求 SSL 加密连接，但 Prisma + pg 适配器需要特殊配置。

**解决方案：**

1. **修改 `lib/prisma.ts`**，在 pg.Pool 配置中添加 SSL：

   ```typescript
   const pool = new pg.Pool({
     connectionString: databaseUrl,
     max: 5,
     ssl: {
       rejectUnauthorized: false // Aurora SSL 连接
     }
   });
   ```

2. **添加环境变量** `NODE_TLS_REJECT_UNAUTHORIZED=0`：

   ```bash
   aws lambda update-function-configuration \
     --function-name koa-mpa-stack-KoaFunction-<后缀> \
     --region ap-northeast-1 \
     --environment 'Variables={NODE_ENV=production,PORT=8082,LOG_LEVEL=error,NODE_TLS_REJECT_UNAUTHORIZED=0,DATABASE_URL="你的连接字符串"}'
   ```

3. **发布新版本并更新别名**（如果使用 AutoPublishAlias）：

   ```bash
   # 发布新版本
   aws lambda publish-version \
     --function-name koa-mpa-stack-KoaFunction-<后缀> \
     --region ap-northeast-1

   # 更新别名指向新版本
   aws lambda update-alias \
     --function-name koa-mpa-stack-KoaFunction-<后缀> \
     --name live \
     --function-version <新版本号> \
     --region ap-northeast-1
   ```

**注意：** `rejectUnauthorized: false` 在 VPC 内部通信是安全的，因为 Lambda 和 Aurora 都在同一个私有网络内。

### 3. Lambda 超时

**可能原因：**

- VPC 冷启动（第一次调用会较慢）
- 数据库连接超时
- 内存不足

**解决方案：**

- 增加 Lambda 超时时间（在 template.yaml 中修改 `Timeout`）
- 增加内存（修改 `MemorySize`）
- 使用 RDS Proxy 减少连接时间

### 4. NAT 网关费用过高

NAT 网关按小时和流量收费。如果成本是问题：

- 考虑使用 NAT 实例代替（更便宜但需要自己管理）
- 或者只在需要时启用 NAT 网关

### 5. 找不到子网或安全组 ID

在 VPC 控制台：

- **子网**: 左侧菜单 → 子网 → 筛选你的 VPC
- **安全组**: 左侧菜单 → 安全组 → 筛选你的 VPC

---

## 💰 成本估算

**⚠️ 注意：Aurora 不提供免费套餐**

使用 Aurora Serverless v2 的成本：

**Lambda 免费额度（12 个月）：**

- Lambda: 100 万次请求 + 40 万 GB-秒计算时间（约 $0/月）
- API Gateway: 100 万次 API 调用（约 $0/月）

**付费项目：**

- **Aurora Serverless v2**:

  - ACU 费用: $0.12/ACU/小时（东京区域）
  - 最小配置 0.5 ACU: 约 $43.2/月（24x7 运行）
  - 存储: $0.10/GB/月
  - I/O: $0.20/100 万次请求

- **NAT 网关**: 约 $32/月（$0.045/小时）

- **数据传输**: 根据实际流量

**总计：** 约 $75-85/月

**成本优化建议：**

1. **使用 Supabase 代替 Aurora**（推荐）

   - 免费套餐: 500MB 数据库 + 2GB 存储
   - 付费计划: $25/月起，比 Aurora 便宜 60%

2. **优化 Aurora 配置**

   - 开发环境设置最小 ACU 为 0.5
   - 非工作时间暂停数据库（需要手动管理）
   - 使用预留容量（1 年承诺可节省 30%）

3. **NAT 网关替代方案**
   - 使用 NAT 实例（需自己管理，约 $10/月）
   - 或直接使用公有子网 + 临时凭证

**推荐方案：Supabase + Lambda**

- 成本: 约 $32/月（仅 NAT 网关）
- 或使用 Supabase 无需 VPC: $0-25/月

---

## 📝 下一步

部署成功后，你可以：

1. **配置自定义域名**

   - 在 Route 53 注册域名
   - 在 API Gateway 配置自定义域名映射

2. **设置 CI/CD**

   - 使用 GitHub Actions 自动部署
   - 使用 AWS CodePipeline

3. **监控和日志**

   - 查看 CloudWatch 日志
   - 设置 CloudWatch 告警

4. **优化性能**

   - 使用 RDS Proxy
   - 配置 Lambda 预留并发
   - 添加 CloudFront CDN

5. **安全加固**
   - 使用 AWS Secrets Manager 管理密钥
   - 启用 WAF（Web Application Firewall）
   - 配置 VPC Flow Logs

---

## 🆘 需要帮助？

如果遇到问题：

1. 查看 Lambda 日志

   ```bash
   sam logs -n KoaFunction --stack-name koa-mpa-stack --tail
   ```

2. 查看 CloudWatch 日志

   - AWS 控制台 → CloudWatch → 日志组 → /aws/lambda/koa-mpa-stack-KoaFunction-xxx

3. 本地测试 Lambda
   ```bash
   sam local start-api --warm-containers EAGER
   ```

---

## ✅ 完成清单

部署完成后，确认以下项目：

- [ ] VPC 和子网创建成功（3 个私有 + 1 个公有）
- [ ] NAT 网关正常运行
- [ ] Aurora PostgreSQL 集群状态为 "可用"
- [ ] Aurora Writer endpoint 可访问
- [ ] Lambda 函数部署成功
- [ ] Lambda 可以连接 Aurora（检查 CloudWatch 日志）
- [ ] API Gateway 可以访问
- [ ] 数据库连接正常（测试 CRUD 操作）
- [ ] Prisma 迁移已运行（表结构已创建）
- [ ] 应用可以正常访问

恭喜你完成了 AWS Aurora PostgreSQL 部署！🎉

**成本提醒：** Aurora 持续运行会产生费用（约 $75-85/月）。如果只是测试，建议使用 Supabase（免费或 $25/月）。
