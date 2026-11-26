/*
 * SnapToTarget.ts
 *
 * 功能
 *   配合 Needle 内置的 DragControls 组件使用。
 *   当本物体被抓取并拖到目标物体附近（距离小于 snapDistance）时，自动吸附到目标上方或挂载为目标的子物体。
 *   可用于“把两个 Cube 堆叠起来”，或“给角色戴上帽子”。
 *
 * 放在哪里
 *   复制到 Needle Web 项目的 src/scripts/interaction/ 目录，文件名保持 SnapToTarget.ts。
 *   不要放进 Unity 的 Assets/ 目录。
 *
 * 怎么挂载
 *   1. 保存文件，切回 Unity 窗口，等待编译结束。
 *   2. 在要被抓取的物体（如 Cube2 或 Hat）上先添加 DragControls 组件。
 *   3. 再添加 SnapToTarget 组件。
 *   4. 把目标物体（如 Cube 或角色头部骨骼 mixamorig:Head）拖到 Target 一栏。
 *   5. 堆叠 Cube 时：Offset Y 设为 0.2，Attach To Target 不勾选。
 *      给角色戴帽子时：Offset Y 设为 0.18（按帽子高度微调），勾选 Attach To Target，帽子会随角色动画一起动。
 */

import { Behaviour, DragControls, serializable } from "@needle-tools/engine";
import { Object3D, Vector3 } from "three";

export class SnapToTarget extends Behaviour {

    // 【Inspector 参数 1】要吸附到的目标物体（例如 Cube 或角色的头部骨骼）。
    @serializable(Object3D)
    target?: Object3D;

    // 【Inspector 参数 2】触发吸附的距离阈值，单位是米。
    @serializable()
    snapDistance: number = 0.25;

    // 【Inspector 参数 3】吸附后相对目标中心点的 Y 轴高度偏移，单位是米。
    @serializable()
    offsetY: number = 0.2;

    // 【Inspector 参数 4】勾选后，吸附时会把本物体挂为目标的子物体（适合给会做动画的角色戴帽子）。
    @serializable()
    attachToTarget: boolean = false;

    private snapped = false;
    private selfWorldPos = new Vector3();
    private targetWorldPos = new Vector3();

    update() {
        if (this.snapped || !this.target) return;

        this.gameObject.getWorldPosition(this.selfWorldPos);
        this.target.getWorldPosition(this.targetWorldPos);
        this.targetWorldPos.y += this.offsetY;

        const dist = this.selfWorldPos.distanceTo(this.targetWorldPos);
        if (dist < this.snapDistance) {
            this.snapNow();
        }
    }

    private snapNow() {
        if (!this.target) return;
        this.snapped = true;

        // 吸附后停用 DragControls，避免拖拽组件继续覆盖位置。
        const drag = this.gameObject.getComponent(DragControls);
        if (drag) {
            drag.enabled = false;
        }

        if (this.attachToTarget) {
            // attach() 会在更换父物体时尽量保留原本的世界旋转与缩放，再把局部位置移到目标上方。
            this.target.attach(this.gameObject);
            this.gameObject.position.set(0, this.offsetY, 0);
        } else {
            this.gameObject.position.set(
                this.target.position.x,
                this.target.position.y + this.offsetY,
                this.target.position.z
            );
        }

        console.log("已吸附到目标：", this.target.name);
    }
}
