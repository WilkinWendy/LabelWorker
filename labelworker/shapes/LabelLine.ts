import Konva from 'konva'
import { Stage } from 'konva/types/Stage'
type Line = Konva.Line;
const Line = Konva.Line

/**
 * 固定可见宽度的线，专门用作图形的线，请勿作它用
 */
export class LabelLine extends Line {
  getStrokeWidth() {
    const stage = this.getStage() as Stage

    try {
      const final = this.attrs['strokeWidth'] / stage.scaleX()
      return final
    } catch (error) {
      // console.log('LabelLine getStrokeWidth error', error)
      return 0
    }
  }

  getHitStrokeWidth() {
    const stage = this.getStage() as Stage

    try {
      const final = this.attrs['hitStrokeWidth'] / stage.scaleX()
      return final
    } catch (error) {
      // console.log('LabelLine getHitStrokeWidth error', error)
      return 0
    }
  }
}

LabelLine.prototype.className = 'LabelLine'
