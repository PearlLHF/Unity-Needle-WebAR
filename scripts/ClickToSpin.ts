/*
 * ClickToSpin.ts
 *
 * 功能
 *   点击物体，物体开始绕自身 Y 轴旋转。再点击一次，停止旋转。
 *   旋转速度可以在 Unity Inspector 里设置。
 *
 * 放在哪里
 *   复制到 Needle Web 项目的 src/scripts/interaction/ 目录，文件名保持 ClickToSpin.ts。
 *   Web 项目目录的位置：在 Unity 里选中带 Needle Engine 组件的对象，看 Location 一栏。
 *   不要放进 Unity 的 Assets/ 目录。
 *
 * 怎么挂载
 *   1. 保存文件，切回 Unity 窗口，等待编译结束。
 *      Needle 会在 Assets/Needle/Components.codegen/ 生成同名的 C# 组件。
 *   2. 在 Hierarchy 选中 Cube（FirstWebAR 场景）。
 *   3. 在 Inspector 点 Add Component，搜索 ClickToSpin，添加。
 *   4. 保存场景，在浏览器里点击 Cube 测试。
 *   物体需要可见，Layer 不能是 Ignore Raycast，物体或它的子物体要有可见网格。
 *
 * Inspector 参数
 *   Speed（speed，数字，默认 1）
 *     旋转速度，单位是弧度每秒。1 约等于每秒 57 度，3.14 约等于每秒半圈。
 *     填负数会反向旋转。
 *
 * 可以怎么改
 *   - 换旋转轴：把 rotateY 改成 rotateX 或 rotateZ。
 *   - 一开始就旋转：把 spinning 的初始值改成 true。
 *   - 查看点击是否生效：取消 onPointerClick 里 console.log 那一行的注释。
 *   - 点击后做别的事：在 onPointerClick 里加自己的代码。
 */

import { Behaviour, serializable } from "@needle-tools/engine";

// 类名和文件名一致。export 让 Needle 能找到这个组件。
// 继承 Behaviour 之后，它可以像 Unity 组件一样挂到物体上。
export class ClickToSpin extends Behaviour {

  // 【Inspector 参数】旋转速度，单位是弧度每秒。
  // @serializable() 让 Unity 里填的数值随场景导出，并在网页里读回来。
  @serializable()
  speed: number = 1;

  // 【状态】记录现在是否在旋转。private 表示只在这个脚本内部使用。
  private spinning = false;

  // 【功能 1：点击切换】点击命中这个物体时，Needle 自动调用这个方法。
  // 每次点击把状态取反：停止变旋转，旋转变停止。
  onPointerClick() {
    this.spinning = !this.spinning;

    // 【调试】需要确认点击是否生效时，去掉下一行开头的两个斜杠。
    // 日志出现在浏览器开发者工具的 Console 里。
    // console.log("Cube 被点击", this.spinning);
  }

  // 【功能 2：旋转】update 每一帧运行一次。
  update() {
    if (this.spinning) {
      // deltaTime 是距离上一帧的时间，单位是秒。
      // 速度乘以时间，得到这一帧要转的角度。这样转速不随帧率变化。
      this.gameObject.rotateY(this.speed * this.context.time.deltaTime);
    }
  }
}
