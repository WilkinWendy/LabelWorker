import Konva from 'konva'
import { CircleConfig } from 'konva/types/shapes/Circle'
import { Stage } from 'konva/types/Stage'
type Circle = Konva.Circle;
const Circle = Konva.Circle

/**
 * 固定可见大小的圆，专门用作图形的端点，请勿做它用
 */
export class LabelCircle extends Circle {
  constructor(config:CircleConfig) {
    super(config)

    // add hover styling

    this.on('mouseenter', function() {
      document.body.style.cursor = 'crosshair'
    })
    this.on('mouseout', function() {
      document.body.style.cursor = 'default'
    })
  }

  getName() {
    return 'LabelCircle'
  }
  getRadius() {
    const stage = this.getStage() as Stage
    try {
      const final = this.attrs['radius'] / stage.scaleX()
      return final
    } catch (error) {
      // console.log('LabelCircle getRadius error', error)
      return 0
    }
  }

  // 用于hit detect
  getStrokeWidth() {
    const stage = this.getStage() as Stage

    try {
      const final = 2 * this.attrs['radius'] / stage.scaleX()
      return final
    } catch (error) {
      // console.log('LabelCircle getStrokeWidth error', error)
      return 0
    }
  }
  // 用于hit detect
  getStroke() {
    return 'transparent'
  }
}

LabelCircle.prototype.className = 'LabelCircle'
