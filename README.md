# 资源分享论坛用户端

这是资源分享论坛的用户端 Web 项目。当前服务端尚未完善，因此用户端在开发环境中使用 MSW mock `/api` 接口，便于先完成 UI、页面逻辑和交互演示。

## 技术栈

- React 19
- TypeScript
- Vite
- React Router
- Ant Design
- Axios
- TanStack Query
- Zustand
- MSW，用于本地 mock `/api` 接口
- Vitest，用于单元测试
- Playwright，用于端到端测试

## 项目结构

```text
user/
├── e2e/                  # Playwright 端到端测试
├── public/               # 静态资源，包含 MSW worker
├── scripts/              # 本地开发和测试辅助脚本
├── src/
│   ├── api/              # Axios 请求封装与 React Query hooks
│   ├── components/       # 公共 UI 组件
│   ├── data/             # 本地 mock 基础数据
│   ├── mocks/            # MSW mock 接口
│   ├── pages/            # 页面级组件
│   ├── store/            # Zustand 状态管理
│   ├── test/             # Vitest 测试初始化
│   ├── utils/            # 工具函数和表单校验逻辑
│   ├── App.tsx           # 路由配置
│   ├── main.tsx          # 应用入口
│   └── styles.css        # 全局样式
├── index.html            # Vite HTML 入口
├── package.json          # 依赖和脚本
├── vite.config.ts        # Vite 配置
├── vitest.config.ts      # Vitest 配置
├── playwright.config.ts  # Playwright 配置
└── README.md
```

## 已实现功能

- 首页资源概览和搜索入口
- 资源库列表、筛选、排序、分页
- 资源详情、评论、举报、收藏、点赞
- 0-5 分资源评分
- 多附件展示和单附件下载
- 求资源列表、筛选、详情、回答
- 发布资源，支持多个附件
- 发布求资源
- 登录、注册、找回密码
- 个人中心资料维护
- 会员中心：积分成长、积分规则、会员权益、当前权益
- 安全中心：修改密码、绑定邮箱、登录记录
- 消息中心未读数量角标

## 启动方式

如果当前在项目根目录，先进入用户端目录：

```powershell
cd user
```

安装依赖：

```powershell
npm.cmd install
```

启动开发服务器：

```powershell
npm.cmd run dev
```

默认访问地址：

```text
http://127.0.0.1:5173
```

如果 PowerShell 禁止直接运行 `npm`，请使用 `npm.cmd`。

## 测试与构建

单元测试：

```powershell
npm.cmd run test
```

端到端测试：

```powershell
npm.cmd run test:e2e
```

生产构建：

```powershell
npm.cmd run build
```

依赖安全审计：

```powershell
npm.cmd audit
```

## 后端接口说明

当前后端尚未完善，开发环境中通过 MSW mock `/api` 接口。

接口请求封装：

```text
src/api/
```

mock 接口：

```text
src/mocks/handlers.ts
```

mock 数据：

```text
src/data/mockRecords.ts
```

后续接入真实后端时，建议优先保持前端调用的接口语义不变，只替换 `/api` 的真实服务。

## 说明

旧的用户端静态 HTML 原型文件已经删除，仅保留 Vite 必需的 `index.html`。本 README 只说明用户端部分。
