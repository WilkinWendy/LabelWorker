/**
 * 每个界面形状必须实现的接口，才能保证正常功能
 */
export interface ShapeBaseInterface {
  /**
   * 开始编辑 包括位置移动和大小变化
   */
  startEdit:()=>void,
  /**
   * 结束编辑 包括位置移动和大小变化
   */
  endEdit:()=>void,

  /**
   * 为自己绑定状态变化响应 ，包括hover态和常态
   */
  bindStatusEvents:()=>void
}