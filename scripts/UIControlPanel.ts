/*
 * UIControlPanel.ts
 *
 * 功能
 *   把 Unity UI 的 Button 和 Legacy Text 连到场景里的物体。
 *   点一下 UI 按钮，切换目标物体的显示/隐藏，并在 Text 上更新当前状态文字。
 *   如果同时拖入了 ClickToSpin 组件，还可以用第二个按钮切换旋转，或者只用一个按钮控制显隐。
 *
 * 放在哪里
 *   复制到 Needle Web 项目的 src/scripts/ui/ 目录，文件名保持 UIControlPanel.ts。
 *   Web 项目目录的位置：在 Unity 里选中带 Needle Engine 组件的对象，看 Location 一栏。
 *   不要放进 Unity 的 Assets/ 目录。
 *
 * 怎么挂载
 *   1. 保存文件，切回 Unity 窗口，等待编译结束。
 *      Needle 会在 Assets/Needle/Components.codegen/ 生成同名的 C# 组件。
 *   2. 在 Hierarchy 选中 Canvas（或场景里新建的空物体 UIController）。
 *   3. 在 Inspector 点 Add Component，搜索 UIControlPanel，添加。
 *   4. 把 UI Button、Legacy Text 和要控制的物体（例如 Cube）拖到对应的栏位里。
 *   5. 保存场景，在浏览器里点击 UI 按钮测试。
 *
 * Inspector 参数
 *   Toggle Button（toggleButton，必填）
 *     用于切换目标物体显隐的 UI Button 组件。
 *   Spin Button（spinButton，可留空）
 *     可选的第二个 UI Button 组件，点击后切换目标物体的旋转状态。
 *   Status Text（statusText，可留空）
 *     用于显示当前状态的 UI Legacy Text 组件（注意不是 TextMeshPro）。
 *   Target Object（targetObject，必填）
 *     要控制显示或隐藏的场景物体，例如 Cube。
 *   Target Spin（targetSpin，可留空）
 *     目标物体上的 ClickToSpin 组件，用来在按钮点击时切换旋转。
 *
 * 可以怎么改
 *   - 改按钮文字提示：修改 updateStatusText 里的中文字符串。
 *   - 控制多个物体：把 targetObject 改成 Object3D[] 数组，用 @serializable([Object3D]) 暴露给 Unity。
 *   - 改成控制角色动作：拖入 AgentController 组件，在按钮回调里调用 triggerReaction("Wave")。
 */

import { Behaviour, Button, GameObject, serializable, Text } from "@needle-tools/engine";
import { Object3D } from "three";
import { ClickToSpin } from "../interaction/ClickToSpin";

export class UIControlPanel extends Behaviour {

    // 【Inspector 参数 1】切换显隐的按钮。
    @serializable(Button)
    toggleButton?: Button;

    // 【Inspector 参数 2】可选：控制旋转的第二个按钮。
    @serializable(Button)
    spinButton?: Button;

    // 【Inspector 参数 3】显示当前状态的 Legacy Text 组件。
    @serializable(Text)
    statusText?: Text;

    // 【Inspector 参数 4】要控制的场景物体，例如 Cube。
    @serializable(Object3D)
    targetObject?: Object3D;

    // 【Inspector 参数 5】可选：目标物体上的 ClickToSpin 组件。
    @serializable(ClickToSpin)
    targetSpin?: ClickToSpin;

    // 【状态】记录目标物体当前是否显示。
    private isVisible = true;

    // 【功能 1：绑定按钮事件】start 在组件首次启用时运行一次。
    start() {
        this.updateStatusText();

        if (this.toggleButton) {
            this.toggleButton.onClick.addEventListener(() => {
                this.toggleTargetVisibility();
            });
        } else {
            console.warn("UIControlPanel: Toggle Button 还没有拖入。");
        }

        if (this.spinButton) {
            this.spinButton.onClick.addEventListener(() => {
                this.toggleTargetSpin();
            });
        }
    }

    // 【功能 2：切换目标物体显隐】
    toggleTargetVisibility() {
        if (!this.targetObject) {
            console.warn("UIControlPanel: Target Object 还没有拖入。");
            return;
        }
        this.isVisible = !this.isVisible;
        GameObject.setActive(this.targetObject, this.isVisible);
        this.updateStatusText();
    }

    // 【功能 3：切换目标物体旋转】调用目标物体上 ClickToSpin 的点击方法。
    toggleTargetSpin() {
        if (!this.targetSpin) {
            console.warn("UIControlPanel: Target Spin 还没有拖入。");
            return;
        }
        this.targetSpin.onPointerClick();
        if (this.statusText) {
            this.statusText.text = "已切换旋转";
        }
    }

    // 【功能 4：更新 UI 文字】把当前状态写回 Legacy Text。
    private updateStatusText() {
        if (!this.statusText) return;
        this.statusText.text = this.isVisible ? "状态：Cube 显示中" : "状态：Cube 已隐藏";
    }
}
