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
   - 内容概述：用 TypeScript 实现点击旋转与提示消息、添加 UI 控件、使用 `DragControls` 拖放和吸附物体，并练习角色动画与交互。
   - 示例脚本：[scripts/](scripts/)
3. 第 3 节课：AI 智能体与角色交互
   - 规划中。第 2 节课的角色练习会为后续接入 AI 回复做准备。

## 仓库结构

```text
Unity-Needle-WebAR/
├── README.md
├── tutorial-1-basic.md                                      # 第 1 节课：创建 WebAR 场景
├── tutorial-2-interaction.md                                # 第 2 节课：TypeScript 交互
├── prerequisite/
│   └── Install Needle Engine Unity Integration.unitypackage # Needle Engine Unity 插件安装包
├── slides/
│   └── Unity-Needle-WebAR-basic.pdf                         # 第 1 节课幻灯片
├── scripts/                                                 # 第 2 节课的 TypeScript 示例脚本
│   ├── AgentController.ts
│   ├── ClickToMessage.ts
│   ├── ClickToSpin.ts
│   ├── SnapToTarget.ts
│   └── UIControlPanel.ts
└── img/                                                     # 教程截图与配图
```

## 使用说明

- 按课程顺序阅读教程；第 2 节课需要先完成第 1 节课，并继续使用 `FirstWebAR` 场景。
- `prerequisite/` 存放课程使用的 Needle Engine Unity 安装包。
- 将 `scripts/` 中需要的脚本复制到 Needle Web 项目的 `src/scripts/` 目录，不要放进 Unity 项目的 `Assets/` 目录。具体操作见[第 2 节课教程](tutorial-2-interaction.md)。

