# AI 编程工具使用指南（以 Unity-Needle-WebAR 为例）

## 为什么不要只用网页版 Chat 写代码？Context（上下文）有多重要？

很多刚接触编程的同学习惯直接打开网页版 Chat 工具（例如 ChatGPT、Claude 或 DeepSeek 网页端），把一段报错或几行代码贴进去问“为什么跑不通”或“帮我加个功能”。这种做法在简单问答时可行，但在做 `Unity-Needle-WebAR` 课程项目时效果往往不好，核心原因在于网页版 Chat 缺少项目上下文（Context）：

1. 它看不到 Unity 端的配置与报错：这门课的大量问题发生在 Unity 侧，比如 Needle 插件安装异常、`Packages/manifest.json` 依赖冲突、`Assets/Needle/Components.codegen/` 没有生成出组件、场景（`.unity`）或预制体（`.prefab`）配置遗漏，以及 `Logs/` 里的导出报错。网页 Chat 看不到这些项目文件，只能让你反复截图，很难定位根因。
2. 它不知道 Web 项目的真实环境与脚本关联：网页 Chat 看不到 `Needle/firstWebAR/package.json` 和 `tsconfig.json`，不清楚 `@needle-tools/engine` 的版本，容易给出过时 API 或普通 Three.js 写法。同时，`src/scripts/` 下多个脚本之间常有联动（比如 `UIControlPanel.ts` 与 `ClickToSpin.ts`，或 `AIAgentService.ts` 与 `AgentController.ts`），只贴几行代码进去，AI 只能靠猜。
3. 手动复制粘贴容易出错：把网页 Chat 生成的代码复制回本地时，新手经常会贴错文件位置、漏掉顶部的 `import` 语句，甚至不小心把 `.ts` 脚本放进 Unity 的 `Assets/` 目录而不是 `Needle/firstWebAR/src/scripts/`，导致一直编译报错。

要让 AI 真正帮上忙，关键不是“换一个更聪明的聊天框”，而是给 AI 提供完整的项目 Context。最直接的方法，就是用界面友好的 AI 编程工具直接打开你的课程项目文件夹（Workspace）。

## 第一部分：为什么要用 Workspace（工作区）？

工作区（Workspace）本质上就是你用 AI 编程软件打开的整个项目文件夹。在本课程中，它不是一个新建的空文件夹，而是你的 Unity 工程根目录（例如 `NeedleEngineTutorial/`，里面同时包含了 Unity 工程文件和 `Needle/firstWebAR/` Web 项目），也可以一并加入课程资料仓库 `Unity-Needle-WebAR/`。

只打开 `Needle/firstWebAR/` 往往不够，因为很多问题出在 Unity 端和 Web 端的联动上。当你使用 Antigravity、GitHub Copilot（VS Code）、Claude Code、Codex、DeepSeek Harness 或 WorkBuddy 打开完整的 Unity 项目根目录后，AI 就拥有了跨两端的完整上下文，能做到三件事：

1. 同时读取 Unity 端和 Web 端文件：AI 既能看到 Unity 的 `Assets/`（包括 `Assets/Needle/Components.codegen/` 自动生成的脚本）、`Packages/manifest.json`、`ProjectSettings/` 和 `Logs/`，也能看到 `Needle/firstWebAR/package.json` 和 `src/scripts/` 里的所有 `.ts` 脚本。
2. 直接帮你创建和修改脚本：你不需要再把代码手动复制出来新建文件。AI 会直接把 `.ts` 脚本放到正确的 `Needle/firstWebAR/src/scripts/` 子目录下保存，避免误放进 `Assets/`，你切回 Unity 就能自动编译出对应组件。
3. 精准排查跨端 Bug：无论是 Unity 里 `Add Component` 搜不到组件、场景导出失败，还是浏览器 Console 报错，AI 都可以结合 Unity 日志、组件生成目录和 Web 端代码一起定位原因，而不是只盯着孤立的代码片段。

## 第二部分：3 步学会用 AI 工具打开课程工作区（实操）

本指南适用于目前图形界面比较友好、适合非编程背景同学上手的 AI 编程工具，包括：
- 集成编辑器类：Antigravity、VS Code（配合 GitHub Copilot、Claude Code 插件或 Codex 插件）
- 独立桌面应用类：Claude Code 桌面端、Codex 桌面端、DeepSeek Harness、WorkBuddy

### 步骤 1：确认你的 Unity 工程根目录

在第 1 节课完成环境搭建后，你的 Unity 工程目录（例如 `NeedleEngineTutorial/`）中已经包含了完整的 Unity 文件以及自动生成的 Web 项目目录（tutorial内容认在 `Needle/firstWebAR/`，以 Unity 中 `Needle Engine` 组件的 `Location` 一栏为准）。

新手注意：
- 建议直接打开整个 Unity 工程根目录（例如 `NeedleEngineTutorial/`），这样 AI 才能同时帮你排查 Unity 端和 Web 端的问题。
- Unity 目录下的 `Library/` 和 `Temp/` 文件夹体积很大，但工程自带的 `.gitignore` 通常会让 AI 工具自动跳过它们，不需要手动删除。
- 如果你使用的是 VS Code，并且希望获得更准确的 TypeScript 语法高亮和补全，可以在打开 Unity 根目录后，再通过 `File -> Add Folder to Workspace...` 把 `Needle/firstWebAR` 文件夹也加入同一个工作区（或者在纯写 `.ts` 脚本时单独打开 `Needle/firstWebAR`）。如果需要参考老师提供的课件和示例代码，也可以把 `Unity-Needle-WebAR` 文件夹一起加进工作区。

### 步骤 2：用 AI 工具打开 Unity 工程根目录

根据你选用的工具类型，按对应方式把 Unity 工程目录设为工作区：

- 如果你使用的是 VS Code（配合 GitHub Copilot / Claude Code / Codex 插件）：
  1. 打开软件，点击左上角菜单栏：`File`（文件） -> `Open Folder...`（打开文件夹）。
  2. 选中你的 Unity 工程根目录（例如 `NeedleEngineTutorial`），点击“打开”或“选择”。
  3. 如果弹窗询问 `"Do you trust the authors of the files in this folder?"`（你信任此文件夹中的文件吗？），勾选同意并点击 `"Yes, I trust the authors"`。
  4. 左侧文件栏同时出现 `Assets/`、`Packages/` 和 `Needle/firstWebAR/` 等目录，即表示工作区已打开。

- 如果你使用的是独立桌面客户端（Claude Code 桌面端、Codex 桌面端、Antigravity 桌面端或者插件、DeepSeek Harness、WorkBuddy）：
  1. 打开对应的桌面应用并登录账号。
  2. 在主界面的项目或工作区选择入口（通常标为 `Open Project`、`Select Folder`、`Code` 标签页或“选择工作目录”），选中你的 Unity 工程根目录（例如 `NeedleEngineTutorial`）。
  3. 确认应用界面显示当前工作目录为你的 Unity 工程根目录，即可开始对话。

### 步骤 3：在对话面板中唤醒 AI，基于全局上下文排查 Unity 与 Web 问题

打开工作区后，打开软件里的 AI 对话面板（例如 Antigravity 对话区、VS Code 右侧 GitHub Copilot Chat / Claude Code Spark 图标 / Codex 侧边栏，或桌面客户端的对话输入框），直接用自然语言描述问题或需求即可。

1. 排查 Unity 端与组件联动问题：
   当遇到 Unity 报错、`Add Component` 搜不到组件、或者导出 WebAR 失败时，可以直接让 AI 检查两端文件。例如：
   > `我在 Unity 里保存后，Add Component 里搜不到 ClickToSpin 组件。请帮我检查Unity 日志、组件生成目录和 Web 端代码，定位一下原因。`

2. 新建或修改 Web 交互脚本：
   在支持 `@` 引用文件的工具（如 Antigravity、GitHub Copilot、Claude Code）中，可以输入 `@` 选中参考脚本，或直接写出路径：
   > `请参考 Needle/firstWebAR/src/scripts/interaction/ClickToSpin.ts 的组件写法，在同一个目录下帮我新建一个 ClickToScale.ts，实现点击物体时在原始大小和 1.5 倍大小之间切换，并告诉我切回 Unity 后怎么把它挂到 Cube 上。`

3. 排查浏览器运行报错：
   当浏览器 Console 出现红色报错时，把报错信息直接贴进对话框，让 AI 结合 `Needle/firstWebAR/src/scripts/` 里的现有代码和 Unity 场景配置一起排查。

4. 确认并应用修改：
   AI 修改或新建文件后，界面通常会展示改动对比（Diff），确认无误后点击 `Accept` / `Apply`（接受/应用）保存文件，再切回 Unity 等待 Needle 自动编译或按 AI 的指引检查场景设置。

## 第三部分：推荐给新手的图文与视频教程

如果想看更完整的界面操作演示，可以参考以下官方图文与视频教程：

### 1. 官方零基础图文文档

- VS Code + GitHub Copilot 官方 Agentic Coding 教程：[Tutorial: Agentic coding in VS Code](https://code.visualstudio.com/docs/agents/agents-tutorial)（详细演示了如何从打开项目文件夹开始，让 AI Agent 直接生成、修改和调试项目代码）。
- OpenAI Codex 开发者文档：[OpenAI Developers Codex Hub](https://developers.openai.com/codex/)（包含 Codex 在 IDE 插件和桌面端中配合本地项目文件夹使用的入门说明）。
- Claude Code 官方文档入口：[Claude Code Overview](https://docs.anthropic.com/en/docs/claude-code/overview)（介绍如何在桌面端和 VS Code 插件中使用本地工作区上下文完成编码任务）。

### 2. YouTube 视频实操教程

- 写给完全新手的 AI 编程全指南：[A complete beginner's guide to coding with AI](https://www.youtube.com/watch?v=k0gmTOm1eus)：讲解了没有编程基础的新手如何借助 AI 编程工具完成一个完整的项目。
