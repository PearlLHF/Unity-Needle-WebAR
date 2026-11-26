/*
 * ClickToMessage.ts
 *
 * 功能
 *   点击物体，在浏览器 Console 打印日志，并在网页上方弹出一条提示消息（showBalloonMessage）。
 *   适合作为最基础的点击反馈模板。
 *
 * 放在哪里
 *   复制到 Needle Web 项目的 src/scripts/interaction/ 目录，文件名保持 ClickToMessage.ts。
 *   不要放进 Unity 的 Assets/ 目录。
 *
 * 怎么挂载
 *   1. 保存文件，切回 Unity 窗口，等待编译结束。
 *      Needle 会在 Assets/Needle/Components.codegen/ 生成同名的 C# 组件。
 *   2. 在 Hierarchy 选中 Cube（FirstWebAR 场景）。
 *   3. 在 Inspector 点 Add Component，搜索 ClickToMessage，添加。
 *   4. 保存场景，在浏览器里点击 Cube 测试。
 *
 * Inspector 参数
 *   Message（message，文字）
 *     点击物体后显示在网页上的提示文字。
 */

import { Behaviour, PointerEventData, serializable, showBalloonMessage } from "@needle-tools/engine";

export class ClickToMessage extends Behaviour {

    // 【Inspector 参数】点击后弹出的提示文字。
    @serializable()
    message: string = "你好，Cube 被点击了！";

    // 【功能：响应点击】点击命中物体时，Needle 自动调用这个方法。
    onPointerClick(_args: PointerEventData) {
        if (!this.message) return;
        console.log("物体被点击：", this.message);
        showBalloonMessage(this.message);
    }
}
