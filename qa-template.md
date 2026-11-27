# 答疑提问模板

> 课程仓库：[Unity-Needle-WebAR](https://github.com/PearlLHF/Unity-Needle-WebAR)  
> 提问前请先按以下模板完成基础排查并简要填写，提问时照着模板向老师描述过程即可。

**基本信息**
- **姓名：**
- **Unity 目录：**（例如：`NeedleEngineTutorial/`）
- **Web 目录：**（Unity 中 `Needle Engine` 组件的 `Location`，例如：`Needle/firstWebAR`）
- **使用的 AI 编程工具：**（Antigravity / VS Code + GitHub Copilot / Claude Code / Codex / DeepSeek Harness / WorkBuddy）

## 一、一开始的问题
- **想实现的功能：**（例如：点击 3D 角色后播放动画并弹出气泡）
- **最初的现象：**（例如：点击无反应 / 网页白屏 / Unity 搜不到组件）
- **最初的报错：**（粘贴 Unity Console 或浏览器 F12 报错文本，或附截图）

## 二、已经尝试的排查方法

### 1. 对照教程排查
- **核对的教程与章节：**（例如：`tutorial-2-interaction.md` 第 X 节）
- **基础项自查：**
  - [ ] 已核对 `Needle Engine` 组件的 `Location`，脚本放在对应 Web 项目的 `src/scripts/` 下
  - [ ] 脚本没有放进 Unity 的 `Assets/`，也没有放错到其他 Web 项目
  - [ ] 修改后已保存，并切回 Unity 等待编译完成
  - [ ] `Assets/Needle/Components.codegen/` 已生成对应组件，且已挂载并填好参数
- **排查结果：**（写明发现了什么，或确认无误但问题依旧）

### 2. 用 AI 编程工具排查（基于工作区 Context）
- **是否打开了完整的 Unity 工程根目录：**（是 / 否）
- **向 AI 描述的问题或需求：**（粘贴你的提问内容）
- **AI 结合项目上下文给出的建议：**（简述 AI 检查了哪些文件、提出了什么方案）
- **修改后的结果：**
  - [ ] 问题依然存在
  - [ ] 原报错消失，但出现了新问题（请按流程排查新问题并简要记录）

### 3. 其他尝试
- （例如：重启 Unity / 重启预览服务 / 清缓存 / 用原版 `scripts/` 做最小对比测试）

## 三、现在的具体问题
- **目前卡住的环节：**（问题现在缩小到了哪一步）
- **如果是修改后出现的新问题，请补充排查过程：**
  - 对照了哪一步教程：
  - 让 AI 工具基于 Context 排查了什么：
  - 尝试了哪些其他验证：
- **最新报错或截图：**（粘贴最新报错文本或附截图）
- **希望老师重点看的地方：**（例如：怀疑 Animator 状态名与代码不匹配，不确定改哪边）
