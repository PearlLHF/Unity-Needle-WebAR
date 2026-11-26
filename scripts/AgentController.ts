/*
 * AgentController.ts
 *
 * 功能
 *   学生交互脚本的最小模板。点击 3D 角色时做三件事：
 *   在 Console 打印日志，显示一句问候语，播放一个动画状态（默认是 Wave）。
 *
 * 放在哪里
 *   复制到 Needle Web 项目的 src/scripts/character/ 目录，文件名保持 AgentController.ts。
 *   Web 项目目录的位置：在 Unity 里选中带 Needle Engine 组件的对象，看 Location 一栏。
 *   不要放进 Unity 的 Assets/ 目录。
 *
 * 怎么挂载
 *   1. 保存文件，切回 Unity 窗口，等待编译结束。
 *      Needle 会在 Assets/Needle/Components.codegen/ 生成同名的 C# 组件。
 *   2. 在 Hierarchy 选中角色物体（最外层的那个物体）。
 *   3. 在 Inspector 点 Add Component，搜索 AgentController，添加。
 *   4. 把带 Animator 组件的物体从 Hierarchy 拖到 Animator 一栏。
 *   5. 保存场景，在浏览器里点击角色测试。
 *   角色或它的子物体要有可见网格，Layer 不能是 Ignore Raycast。
 *   没有角色模型时，可以先挂在 Cube 上，Animator 留空。点击后仍会有日志和问候语。
 *
 * Inspector 参数
 *   Animator（animator，可留空）
 *     角色身上的 Animator 组件。留空时，脚本会在自己所在的物体和子物体上找一个。
 *   Greeting Text（greetingText，文字）
 *     点击角色后显示的问候语。
 *   Reaction State（reactionState，文字，默认 Wave）
 *     点击后播放的动画状态名。要和 Unity Animator Controller 里的状态名完全一致，区分大小写。
 *   Dialog Panel（dialogPanel，可留空）
 *     可选：Unity Canvas 里的对话弹窗面板（例如 Panel）。拖入后，点击角色会显示该面板而不是网页顶部 toast。
 *   Dialog Text（dialogText，可留空）
 *     可选：对话面板里用于显示问候语的 Legacy Text 组件。
 *   Close Button（closeButton，可留空）
 *     可选：对话面板里的关闭 Button 组件，点击后隐藏面板。
 *
 * 可以怎么改
 *   - 换问候语或动画：直接在 Inspector 里改 Greeting Text 和 Reaction State。
 *   - 改用 Animator 参数触发动画：把 triggerReaction 里的 play 换成 setTrigger 或 setBool。
 *   - 接入语音或 AI 回复：在 onPointerClick 里调用自己的函数，再用 triggerReaction 播放对应动作。
 *   - 其他脚本也可以调用 triggerReaction("状态名") 让角色做动作。
 */

import { Animator, Behaviour, Button, GameObject, PointerEventData, serializable, showBalloonMessage, Text } from "@needle-tools/engine";
import { Object3D } from "three";

// 类名和文件名一致。export 让 Needle 能找到这个组件。
export class AgentController extends Behaviour {

    // 【Inspector 参数 1】角色的 Animator 组件。
    // 引用其他组件时，@serializable 的括号里要写上类型。
    @serializable(Animator)
    animator?: Animator;

    // 【Inspector 参数 2】问候语。数字、文字、布尔值用 @serializable() 即可。
    @serializable()
    greetingText: string = "你好，我是你的 AR 情绪陪伴助手。";

    // 【Inspector 参数 3】点击后播放的动画状态名。
    @serializable()
    reactionState: string = "Wave";

    // 【Inspector 参数 4】可选：Unity UI 对话弹窗面板。
    @serializable(Object3D)
    dialogPanel?: Object3D;

    // 【Inspector 参数 5】可选：弹窗里的 Legacy Text 组件。
    @serializable(Text)
    dialogText?: Text;

    // 【Inspector 参数 6】可选：弹窗里的关闭按钮。
    @serializable(Button)
    closeButton?: Button;

    // 【功能 1：初始化】start 在组件第一次启用时运行一次。
    start() {
        // Inspector 里没有拖入 Animator 时，在自己和子物体上找一个。
        if (!this.animator) {
            this.animator = this.gameObject.getComponentInChildren(Animator) ?? undefined;
        }
        // 默认隐藏对话弹窗，并绑定关闭按钮。
        if (this.dialogPanel) {
            GameObject.setActive(this.dialogPanel, false);
        }
        if (this.closeButton && this.dialogPanel) {
            this.closeButton.onClick.addEventListener(() => {
                if (this.dialogPanel) GameObject.setActive(this.dialogPanel, false);
            });
        }
        console.log("Agent 初始化成功");
    }

    // 【功能 2：响应点击】点击命中角色或它的子物体时，Needle 自动调用这个方法。
    // 参数里有点击位置等信息，这里没有用到，所以名字前面加下划线。
    onPointerClick(_args: PointerEventData) {
        console.log("点击了角色");
        this.showGreeting();
        this.triggerReaction(this.reactionState);
    }

    // 【功能 3：显示问候语】在 Console 打印，并显示对话弹窗（未绑定面板时退回网页 toast 提示）。
    showGreeting() {
        if (!this.greetingText) return;
        console.log(this.greetingText);
        if (this.dialogPanel) {
            if (this.dialogText) {
                this.dialogText.text = this.greetingText;
            }
            GameObject.setActive(this.dialogPanel, true);
        } else {
            showBalloonMessage(this.greetingText);
        }
    }

    // 【功能 4：播放动画】animationName 是 Animator Controller 里的状态名。
    // 没有 Animator 时只打印一条警告，不会报错。
    triggerReaction(animationName: string) {
        if (this.animator) {
            this.animator.play(animationName);
        } else {
            console.warn("AgentController 没有找到 Animator，无法播放动画：" + animationName);
        }
    }
}
