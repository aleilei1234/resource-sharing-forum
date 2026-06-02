# 资源分享论坛后端

本仓库用于搭建“资源分享论坛”的 Spring Boot 后端开发环境。当前版本完成了后端接口骨架和 V2 数据库工程化落地，覆盖账号认证、资源发布与审核、附件下载、互动评论、求资源悬赏、会员积分、举报投诉、通知和后台管理等课程项目核心模块。

## 技术栈

- Java 21
- Spring Boot 3.3
- Spring Web / Validation / Security
- Spring JDBC / Flyway
- MySQL 8.x
- JWT 鉴权
- Maven Wrapper

## 项目结构

```text
backend/
├── pom.xml
├── docker-compose.yml
├── README_DATABASE.md
├── src/main/java/com/resourcesharing/forum/
│   ├── controller/      # REST 接口
│   ├── service/         # 业务服务骨架
│   ├── dto/             # 请求与响应 DTO
│   ├── domain/          # 领域枚举
│   ├── security/        # JWT 与认证过滤器
│   ├── config/          # 安全、链路追踪配置
│   └── common/          # 统一响应、分页、异常
└── src/main/resources/
    ├── application.yml
    ├── schema.sql       # V2 手动建库脚本
    ├── data.sql         # V2 手动种子数据
    └── db/migration/    # Flyway 自动迁移脚本
```

## 数据库

数据库采用 V2 工程化模型，核心表共 35 张。表结构严格使用说明书中的 V2 命名，例如：

- `user_account`
- `member_profile`
- `administrator_profile`
- `membership_level`
- `member_point_account`
- `point_flow`
- `resource_info`
- `resource_category`
- `tag_info`
- `file_attachment`
- `resource_audit_record`
- `resource_status_log`
- `download_record`
- `user_interaction`
- `comment_info`
- `resource_rating`
- `request_post`
- `request_reply`
- `report_complaint`
- `appeal_record`
- `notification_event`
- `system_notice`
- `admin_operation_log`

数据库文件：

- `backend/src/main/resources/schema.sql`：V2 手动建库脚本
- `backend/src/main/resources/data.sql`：V2 手动种子数据
- `backend/src/main/resources/db/migration/V1__create_v2_schema.sql`：Flyway 建表迁移
- `backend/src/main/resources/db/migration/V2__seed_v2_data.sql`：Flyway 种子数据迁移
- `backend/README_DATABASE.md`：数据库导入、校验和运行说明

## 快速启动

进入后端目录：

```powershell
cd backend
```

创建 MySQL 数据库：

```sql
CREATE DATABASE resource_sharing_forum
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

配置数据库账号密码：

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "你的MySQL密码"
```

启动服务：

```powershell
.\mvnw.cmd spring-boot:run
```

默认服务地址：

```text
http://localhost:8080
```

健康检查：

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

## Docker MySQL

如果本机没有现成 MySQL，可以使用 `backend/docker-compose.yml` 启动 MySQL 8：

```powershell
cd backend
$env:MYSQL_ROOT_PASSWORD = "root"
docker compose up -d mysql
```

容器会自动创建 `resource_sharing_forum` 数据库，并使用 `utf8mb4_unicode_ci` 字符集排序规则。

## 测试

```powershell
cd backend
.\mvnw.cmd test
```

如果 Maven Central 访问受限，可以临时使用本地 Maven 镜像配置运行测试，不需要把本机镜像配置提交到仓库。

## 接口模块

- `GET /api/health`：健康检查
- `/api/auth/**`：注册、登录、退出
- `/api/users/**`：当前用户资料
- `/api/resources/**`：资源发布、列表、详情、提交审核、收藏、点赞、评分
- `/api/files/**`：附件上传、附件列表、下载入口
- `/api/admin/resources/**`：后台资源审核、驳回、下架、恢复
- `/api/requests/**`：求资源发布、回答、采纳
- `/api/members/**`：会员等级、积分流水、权益
- `/api/reports/**`：举报、版权投诉
- `/api/notifications/**`：通知列表、未读数、已读

所有接口统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "traceId": "request-trace-id"
}
```

## 当前状态

当前后端以课程项目骨架和数据库工程化落地为主。Flyway 已接入，V2 表结构和种子数据可以自动迁移；后续业务持久化可以基于现有表结构继续实现 Repository、事务服务和接口数据落库。
