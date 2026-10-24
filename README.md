# dsh-zh-thinking — 本地 workspace-zh 分支

这是 [yingjian666/dsh-zh-thinking](https://github.com/yingjian666/dsh-zh-thinking) 的工作区隔离维护版，维护分支为 `workspace-zh`。相比上游全局语言要求，本分支仅对明确匹配的论文工作区注入中文偏好，其它工作区默认关闭。

当前为个人定制版本，工作区路径常量位于 `lib/index.js` 的 `WORKSPACE`；其他用户安装前需修改为自己的工作区绝对路径。没有上传论文内容、用户配置或凭据。

## 行为与隔离边界

- **只对 `D:\PythonProject\memPaper` 工作区启用**，其它工作区默认关闭。子目录也不自动启用（精确根目录匹配）。
- 每次系统提示词 assembly 都从实际 DSH 字段 `context.agent.session.header.cwd` 重新判断；不使用插件所在目录、进程 cwd、全局当前工作区、历史请求或环境变量。
- 缺少 agent/session/header/cwd、相对路径、不明确的盘符路径均返回空文本（fail closed）。Windows 盘符/大小写、斜杠和尾部分隔符按 Windows 路径规则归一化；不解析符号链接或目录别名。
- 中文规划、工具说明、可见推理摘要与最终回复是**默认偏好**，用户明确要求英文摘要（English abstract）、英文段落或其它语言时应遵从。
- 不要求披露隐藏思维链，也不承诺控制模型内部推理语言。测试验证注入内容和隔离，不验证模型一定遵循语言偏好。
- `enabled: false` 可关闭整个插件；不配置时仅上述白名单工作区启用。

## 已验证的宿主契约

先读取本机可读 npm 安装中的 `@deepseek-ai/dsh-system-prompt/README.md` 和 `lib/types/index.d.ts`，以及 `@deepseek-ai/dsh-agent/lib/types/runtime-types.d.ts`，再检查 agent-loop：

1. `systemPrompt.section({ name, order, text })` 的 `text` 支持 `(context: AssembleContext) => string`，每次 assembly 求值。
2. agent 包扩展 `AssembleContext.agent`；agent-loop 的 cwd 变量来自 `context.agent?.session.header.cwd`。
3. 注册返回 Cordis disposer，由 `ctx.effect` 负责卸载。空字符串在 `renderPrompt` 时被过滤。

本机真实内核测试使用 `C:\Users\Administrator\.dsh\profiles\node_modules`（链接至可读 npm 安装），没有扫描或解包 `app.asar`。此验证不等同于正在运行的 Desktop/Web 内核已加载插件；若其版本或 assembly context 不同，缺失 cwd 会安全地不注入。

## 安装与验证

维护者本机已通过本地目录链接注册到 Desktop，并已重启。模块解析和真实可读内核测试通过；运行中 GUI 的逐请求注入仍应按以下方式核验，不将中文回复本身当作生效证据：

1. 从本地目录选择 `D:\webProject\dsh-zh-thinking` 作为插件来源；不要选择上游 GitHub 来源，否则会加载上游全局启用版本。
2. 使用宿主支持的本地目录/`link:` 插件机制。非 Desktop 的 profile 可参考 `dsh plugin --profile <name> add link:D:\webProject\dsh-zh-thinking`；Desktop 由其插件管理器管理。具体当前 Web/桌面接入入口应另行确认。
3. 重启后分别在目标与其它工作区检查组装提示词：仅目标应包含“当前工作区语言偏好”。另测英文摘要例外；仅观察中文回复不足以证明插件加载。
4. 如需停用，移除该本地插件注册或设置 `enabled: false`。不要修改全局 persona 来实现此偏好。

bundle patch 中的注册是宿主级的，但其文本提供函数是**每次请求条件化**的；注册本身不代表所有工作区都会收到指导。

## 测试与本地维护

Node 22+，无需安装依赖：

```powershell
node --check lib/index.js
node test/kernel-smoke.mjs C:\Users\Administrator\.dsh\profiles\node_modules
# 或：$env:DSH_KERNEL_NODE_MODULES = '<可读 DSH node_modules>'; npm run test:kernel
```

真实 Cordis + SystemPrompt 的 24 项检查覆盖：目标工作区、Windows 路径归一化、前缀碰撞/子目录/不同盘符、缺失上下文、A→B→A 并发交错、同一 agent cwd 改变、英文例外文本、卸载清理与显式关闭。测试启动的仅是内存内核注册表，不启动服务、不请求模型、不写 profile。

维护时先 `git status`，在 `workspace-zh` 分支审查上游变化，保留本地白名单与测试；不要直接覆盖为上游全局静态提示词。旧版上游兼容性表不作为本分支兼容承诺。

## 许可证

保留上游 MIT 许可证及作者署名，见 LICENSE。原始项目：https://github.com/yingjian666/dsh-zh-thinking 。
