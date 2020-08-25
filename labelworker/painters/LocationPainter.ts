import Konva from 'konva'
import { getRealMousePosFuncBuilder } from '../tools'
import { LabelLine } from '../shapes'
import { Stage } from 'konva/types/Stage'
type Layer = Konva.Layer;

const baseWidth = 1
/**
 * 十字准星定位绘制器 配置接口
 */
export interface LocationPainterConfig {
  // 临时绘制图层
  locationLayer: Layer;
  // 底图layer 为了确定location边界
  imgLayer: Layer;
  // 颜色
  color: string;
}

/**
 * 十字准星定位绘制器
 */
export class LocationPainter {
  private _isDrawing: boolean = false;
  private _locationLayer!: Layer;
  private _imgLayer!: Layer;
  private _color!: string;

  private horizontalLine!: LabelLine;
  private verticalLine!: LabelLine;

  private _isEnabeld: boolean = false;

  constructor(config: LocationPainterConfig) {
    this._locationLayer = config.locationLayer
    this._imgLayer = config.imgLayer
    this._color = config.color
  }

  setColor(val: string) {
    this._color = val
  }

  getColor() {
    return this._color
  }

  /**
   * 开启/关闭鼠标十字跟随
   */
  enable(isEnable: boolean) {
    // 如果重复操作则忽略
    if (isEnable === this._isEnabeld) {
      return
    }
    const _stage = this._locationLayer.getStage() as Stage
    const _locationLayer = this._locationLayer
    const _this = this

    if (isEnable) {
      this._isEnabeld = isEnable
      window.addEventListener('mousemove', this.updateLocation)
      _locationLayer.show()
    } else {
      this._isEnabeld = isEnable
      window.removeEventListener('mousemove', this.updateLocation)
      _locationLayer.hide()
    }
  }

  private updateLocation = (() => {
    const _this = this
    const _locationLayer = this._locationLayer
    const _imgLayer = this._imgLayer
    const _stage = this._locationLayer.getStage() as Stage

    // 鼠标的坐标
    const getRealMousePos = getRealMousePosFuncBuilder(_stage)
    const points = getRealMousePos()

    // 图片的宽高
    const image = _imgLayer.children && _imgLayer.children[0]
    const imageWidth = image.width()
    const imageHeight = image.height()

    if (
      points.x < 0 ||
      points.y < 0 ||
      points.x > imageWidth ||
      points.y > imageHeight
    ) {
      // 鼠标超出图片范围，则隐藏
      _locationLayer.hide()
    } else {
      _locationLayer.show()

      if (!this.horizontalLine) {
        this.horizontalLine = new LabelLine({
          points: [0, points.y, imageWidth, points.y],
          stroke: _this._color,
          strokeWidth: baseWidth,
          lineJoin: 'round'
        })
        this._locationLayer.add(this.horizontalLine)
      }

      if (!this.verticalLine) {
        this.verticalLine = new LabelLine({
          points: [points.x, 0, points.x, imageHeight],
          stroke: _this._color,
          strokeWidth: baseWidth,
          lineJoin: 'round'
        })
        this._locationLayer.add(this.verticalLine)
      }

      this.verticalLine.points([points.x, 0, points.x, imageHeight])
      this.verticalLine.stroke(_this._color)

      this.horizontalLine.points([0, points.y, imageWidth, points.y])
      this.horizontalLine.stroke(_this._color)
    }

    _locationLayer.batchDraw()
  })
}
