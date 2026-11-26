# Unity-Needle-WebAR

本仓库存放基于 Unity 与 Needle Engine 的 WebAR 课程课件与实验教程。

## 课程内容

1. 第 1 节课：从 Unity 场景到 WebAR
   - 教程文档：[tutorial-1-basic.md](tutorial-1-basic.md)
   - 课程幻灯片：[slides/Unity-Needle-WebAR-basic.pdf](slides/Unity-Needle-WebAR-basic.pdf)
   - 内容概述：环境检查、安装 Needle Engine 插件、创建 `FirstWebAR` 场景、桌面浏览器预览、手机端 WebAR 入口与桌面/地面放置测试。
   - 完成结果：创建一个带 `Cube` 的 WebAR 场景，后续课程会在此基础上继续练习。
2. 第 2 节课：用 TypeScript 给物体加交互
   - 教程文档：[tutorial-2-interaction.md](tutorial-2-interaction.md)
   - 课程幻灯片：[slides/Unity-Needle-WebAR-interaction.pdf](slides/Unity-Needle-WebAR-interaction.pdf)
   - 内容概述：用 TypeScript 实现点击旋转与提示消息、添加 UI 控件、使用 `DragControls` 拖放和吸附物体，并练习角色动画与交互。
   - 示例脚本：[scripts/](scripts/)
3. 第 3 节课：用 AI 智能体给物体与角色赋能
   - 教程文档：[tutorial-3-ai-agent.md](tutorial-3-ai-agent.md)
   - 课程幻灯片：[slides/Unity-Needle-WebAR-ai-agent.pdf](slides/Unity-Needle-WebAR-ai-agent.pdf)
   - 内容概述：使用 `AgentWorldBubble.prefab` 与 Needle `arOverlayElement` 实现单轮对话（`AskAgent.ts`）、多轮对话与历史面板（`MultiTurnAgent.ts`），并在第 2 节课角色上接入结构化 JSON 动作与语音朗读（`AIAgentService.ts`）。
   - 预制体与示例脚本：[prefabs/](prefabs/)、[scripts/](scripts/)

## 仓库结构

```text
Unity-Needle-WebAR/
├── README.md
├── tutorial-1-basic.md                                      # 第 1 节课：创建 WebAR 场景
├── tutorial-2-interaction.md                                # 第 2 节课：TypeScript 交互
├── tutorial-3-ai-agent.md                                   # 第 3 节课：AI 智能体与角色交互
├── prefabs/
│   └── AgentWorldBubble.prefab                              # 第 3 节课：物体/角色上方 3D 对话气泡预制体
├── prerequisite/
│   ├── Install Needle Engine Unity Integration.unitypackage # Needle Engine Unity 插件安装包
│   ├── NotoSansSC-Regular.ttf                               # 中文字体文件
│   └── common-chinese-chars.txt                             # 6763 个常用汉字与标点（已内置于气泡预制体）
├── slides/
│   ├── Unity-Needle-WebAR-basic.pdf                         # 第 1 节课幻灯片
│   ├── Unity-Needle-WebAR-interaction.pdf                   # 第 2 节课幻灯片
│   └── Unity-Needle-WebAR-ai-agent.pdf                      # 第 3 节课幻灯片
├── scripts/                                                 # 第 2、3 节课的 TypeScript 示例脚本
│   ├── AIAgentService.ts
│   ├── AgentController.ts
│   ├── AskAgent.ts
│   ├── ClickToMessage.ts
│   ├── ClickToSpin.ts
│   ├── MultiTurnAgent.ts
│   ├── SnapToTarget.ts
│   └── UIControlPanel.ts
└── img/                                                     # 教程截图与配图
```

