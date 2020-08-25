import Konva from 'konva'
type Stage = Konva.Stage

/**
 * 得到坐标
 * @param stage
 */
export function getRealMousePosFuncBuilder(stage:Stage) {
  const transform = stage.getAbsoluteTransform().copy()

  // to detect relative position we need to invert transform
  transform.invert()

  return function getRealMousePos() {
    const pos = stage.getPointerPosition()
    // stage有时并不会emit时间，例如drag时没有emitmousemove事件，导致逻辑失效，为了提高兼容性，我将部分事件转移到window上，但是到了window上，当前stage就有可能并不存在鼠标焦点，故加了这个空置0逻辑
    if (!pos) {
      return { x: 0, y: 0 }
    }
    return transform.point(pos)
  }
}

export function getRealMousePosFunc(stage:Stage) {
  const transform = stage.getAbsoluteTransform().copy()
  transform.invert()
  const pos = stage.getPointerPosition()
  if (!pos) {
    return { x: 0, y: 0 }
  }
  return transform.point(pos)
}
