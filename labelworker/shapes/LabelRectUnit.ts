import Konva from 'konva'
import { ContainerConfig } from 'konva/types/Container'
import { Layer } from 'konva/types/Layer'
import {
  getRealMousePosFuncBuilder,
  SimplePoint,
  generateRectParams
} from '../tools'
import { KonvaEventListener, KonvaEventObject } from 'konva/types/Node'
import { LabelLine } from './LabelLine'
import { LabelCircle } from './LabelCircle'
import { LabelText } from './LabelText'
import { ShapeConfig } from 'konva/types/Shape'
import { ShapeBaseInterface } from './interface/ShapeBaseInterface'

type Stage = Konva.Stage;
const Group = Konva.Group
type Group = Konva.Group;

type Rect = Konva.Rect;
const Rect = Konva.Rect

export interface LabelRectUnitConfig extends ShapeConfig {
  x: number;
  y: number;
  height: number;
  width: number;
  color: string;
  status?: LabelRectUnitStatus;
  text?: string;
}

export enum LabelRectUnitStatus {
  Normal = 1,
  Active = 2,
  Hover = 4
}

/**
 * 矩形标注框
 */
export class LabelRectUnit extends Group implements ShapeBaseInterface {
  protected baseStrokeWidth = 3; // 基准宽度

  protected _color!: string;
  private _status!: LabelRectUnitStatus;

  protected _rect!: Rect; // 背景矩形
  protected _lines!: LabelLine[]; // 线框
  protected _points!: LabelCircle[]; // 顶点
  protected _text!: LabelText; // 左上角文本

  // #region
  private _statusClickEvent!: () => void;
  private _statusMouseMoveEvent!: (e: KonvaEventObject<MouseEvent>) => void;
  private _statusMouseOutEvent!: (e: KonvaEventObject<MouseEvent>) => void;

  private _isEditing: boolean = false;
  private _firstDrawCompleted = false;
  // #endregion

  // a flag to fix bug
  public _isConstructoring!: boolean;

  constructor({
    status = LabelRectUnitStatus.Normal,
    ...otherConfig
  }: LabelRectUnitConfig) {
    super({ ...otherConfig, status })
    this._color = otherConfig.color
    this._drawRectWithAttrs()
    if (this._firstDrawCompleted) {
      // 绘制过程中因为参数赋值顺序的原因，可能存在参数不完整的中间状态
      // 只有当参数完整的第一次绘制出全图形，才可以更改状态
      this.changeStatus(otherConfig.status)
    }
    this._isConstructoring = false
    // this.bindStatusEvents()
    this._bindBoundValidateFunc()
  }

  // #region construct
  /**
   * 根据属性构造一个矩形框,并将子元素赋值出去
   */
  private _drawRectWithAttrs() {
    const attrs: LabelRectUnitConfig = this.getAttrs()
    if (
      typeof attrs.x === 'undefined' ||
      typeof attrs.y === 'undefined' ||
      typeof attrs.width === 'undefined' ||
      typeof attrs.height === 'undefined' ||
      typeof attrs.color === 'undefined'
    ) {
      this._firstDrawCompleted = false
      return false
    }
    // 下面根据attrs来重新渲染
    const points = this._generateOrderedPoints(attrs)

    // rect
    let rect: Rect
    if (!this._rect) {
      rect = new Rect({
        X: 0,
        y: 0,
        width: attrs.width,
        height: attrs.height,
        fill: 'transparent',
        strokeWidth: 0
      })
      this._rect = rect
      this.add(rect)
      rect.zIndex(0)
      rect.on('mouseenter', function() {
        document.body.style.cursor = 'all-scroll'
      })
      rect.on('mouseout', function() {
        document.body.style.cursor = 'default'
      })
    } else {
      rect = this._rect
      rect.setAttrs({
        X: 0,
        y: 0,
        width: attrs.width,
        height: attrs.height,
        fill: 'transparent',
        strokeWidth: 0
      })
    }

    // 分辨率文字

    let text: LabelText
    if (this._text) {
      text = this._text
    } else {
      text = this._text = new LabelText({
        x: +points[0].x,
        y: +points[0].y,
        fontFamily: 'Arial',
        fontSize: this.baseStrokeWidth * 5,
        padding: this.baseStrokeWidth * 3,
        fill: this._color,
        visible: true,
        listening: false
      })
      this.add(text)
      text.zIndex(1)
    }

    const textWord = this.getAttr('text')
    text.text(textWord)

    // 实线
    let line: LabelLine
    if (this._lines && this._lines.length) {
      line = this._lines[0]
    } else {
      line = new LabelLine({
        points: [],
        strokeWidth: this.baseStrokeWidth,
        hitStrokeWidth: this.baseStrokeWidth * 3,
        stroke: attrs.color
      })
      this._lines = [line]
      this.add(line)
      line.zIndex(2)
    }

    line.points([
      +points[0].x,
      +points[0].y,
      +points[1].x,
      +points[1].y,
      +points[2].x,
      +points[2].y,
      +points[3].x,
      +points[3].y,
      +points[0].x,
      +points[0].y
    ])
    // circles

    let circles: LabelCircle[]
    if (this._points && this._points.length) {
      circles = this._points
    } else {
      circles = this._points = points.map(item => {
        return new LabelCircle({
          x: +item.x,
          y: +item.y,
          radius: this.baseStrokeWidth * 2,
          fill: attrs.color
        })
      })
      circles.forEach(item => {
        this.add(item)
        item.zIndex(3)
      })
    }

    points.forEach(({ x, y }, i) => {
      circles[i].position({
        x,
        y
      })
    })

    this._changeCurrentStatusStyle()
    this._firstDrawCompleted = true
    return true
  }

  /**
   * 生成顺时针坐标
   */
  private _generateOrderedPoints(attrs: LabelRectUnitConfig) {
    const { x, y, width, height } = attrs
    return [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ]
  }

  // #endregion

  // #region  property

  getColor() {
    return this._color
  }

  setColor(val: string) {
    this._setAttr('color', val)
    this._color = val
    if (this._isConstructoring) {
      return
    }
    this._drawRectWithAttrs()
  }

  setWidth(val: number) {
    this._setAttr('width', val)
    if (this._isConstructoring) {
      return
    }
    this._drawRectWithAttrs()
  }

  setHeight(val: number) {
    this._setAttr('height', val)
    if (this._isConstructoring) {
      return
    }
    this._drawRectWithAttrs()
  }

  // #endregion

  // #region event

  bindStatusEvents() {
    let lastStatus = LabelRectUnitStatus.Normal

    let ismoving = false
    this._statusMouseMoveEvent = () => {
      // console.log('rect enter')
      if (ismoving) return
      if (this._status === LabelRectUnitStatus.Active) return
      ismoving = true
      lastStatus = this._status
      this.changeStatus(LabelRectUnitStatus.Hover)
    }
    this._statusMouseOutEvent = e => {
      // console.log('rect out')
      if (this._status === LabelRectUnitStatus.Active) return
      ismoving = false
      this.changeStatus(lastStatus)
    }

    this._rect.on('mouseenter', this._statusMouseMoveEvent)
    this._rect.on('mouseout', this._statusMouseOutEvent)
  }

  unbindStatusEvent() {
    this._rect.off('mouseenter', this._statusMouseMoveEvent)
    this._rect.off('mouseout', this._statusMouseOutEvent)
  }

  _bindBoundValidateFunc() {
    // this.on("widthChange heightChange ")
  }

  // #endregion

  // #region action

  /**
   * 更改状态
   * @param status
   */
  changeStatus(status: LabelRectUnitStatus) {
    const old = this._status
    this._status = status
    this._drawRectWithAttrs()
    this._fireChangeEvent('status', old, status)

    this.getLayer()?.batchDraw()
  }

  _changeCurrentStatusStyle() {
    const status = this._status
    switch (status) {
      case LabelRectUnitStatus.Active:
        this._rect.fill(this._color)
        this._rect.opacity(0.3)

        // // 分辨率文字
        // const text = this.getText()
        // text && text.visible(true)
        break
      case LabelRectUnitStatus.Hover:
        this._rect.fill(this._color)
        this._rect.opacity(0.1)
        break

      default:
        this._rect.fill('transparent')
        this._rect.opacity(1)
        break
    }
  }

  private editMouseDownEvent!: (e: KonvaEventObject<MouseEvent>) => void;
  private editMouseupEvent!: (e: MouseEvent) => void;
  /**
   * 将当前元素置于当前图层中进行编辑
   */
  startEdit() {
    const _this = this
    const layer = this.getLayer() as Layer
    const stage = this.getStage() as Stage
    if (!layer || !stage) {
      console.log(layer.parent, stage)
      console.log('layer stage 必须同时存在方可编辑')
      return
    }

    if (this._isEditing) {
      console.log('已经在编辑态，阻止再次进入')
      return
    }
    console.log('进入在编辑态')
    this._isEditing = true

    let isSingleEditing = false
    let mousemoveFunc: (e: KonvaEventObject<MouseEvent>) => void
    _this.on(
      'mousedown',
      (_this.editMouseDownEvent = e => {
        if (isSingleEditing) {
          return
        }

        const target = e.target
        if (target instanceof LabelCircle) {
          isSingleEditing = true
          console.log('点的是矩形的端点 准备resize')

          // 禁用后续click
          // @ts-ignore
          Konva.listenClickTap = false

          // 每次鼠标按下，真实坐标计算函数 及当前参数都需重新计算
          const getRealPos = getRealMousePosFuncBuilder(stage)
          const {
            x,
            y,
            width,
            height
          } = this.getAttrs() as LabelRectUnitConfig

          let fixedPoint: SimplePoint

          // 如果点的是顶点
          switch (_this._points.indexOf(target)) {
            case 0: // 左上
              fixedPoint = {
                x: x + width,
                y: y + height
              }
              break
            case 1: // 右上
              fixedPoint = {
                x: x,
                y: y + height
              }
              break
            case 2: // 右下
              fixedPoint = {
                x: x,
                y: y
              }
              break
            case 3: // 左下
              fixedPoint = {
                x: x + width,
                y: y
              }
              break

            default:
              console.log('进了default')
              break
          }
          console.log('mousemoveFunc 绑定')
          mousemoveFunc = () => {
            console.log('点的是矩形的端点 resizing中')
            const point = getRealPos()
            const { x, y, height, width } = generateRectParams(
              point,
              fixedPoint
            )
            // console.log(point, fixedPoint, { x, y, height, width })
            _this.position({
              x,
              y
            })
            _this.height(height)
            _this.width(width)
            layer.batchDraw()
          }
          stage.on('mousemove', mousemoveFunc)
        } else if (target instanceof Konva.Rect) {
          isSingleEditing = true
          console.log('点的是矩形的面 drag开始')
          _this.draggable(true)
        }

        console.log('mousedown', e.target)
      })
    )

    window.addEventListener(
      'mouseup',
      (_this.editMouseupEvent = e => {
        if (!isSingleEditing) {
          return
        }
        isSingleEditing = false
        console.log('mouseup LabelRectUnit not editing')
        mousemoveFunc && stage.off('mousemove', mousemoveFunc)
        _this.draggable(false)
        console.log('drag结束')
        console.log('resize结束')
      })
    )
  }

  endEdit() {
    // 只有本来就在编辑态才有取消编辑态一说
    if (this._isEditing) {
      const stage = this.getStage() as Stage
      this.editMouseDownEvent && this.off('mousedown', this.editMouseDownEvent)
      this.editMouseupEvent &&
        window.removeEventListener('mouseup', this.editMouseupEvent)
      this.draggable(false)
      console.log('取消编辑态')
      this._isEditing = false
    }
  }
  // #endregion

  destroy(): this {
    this.endEdit()
    super.destroy()
    return this
  }

  outRange() {
    const bkg = this.getStage()?.findOne('.bkg')
    return (
      this.x() < 0 ||
      this.width() + this.x() > (bkg?.width() || 1920) ||
      this.y() < 0 ||
      this.height() + this.y() > (bkg?.height() || 1080)
    )
  }
}

/**
 * a flag to fix bug,
 * when konva is create a shape in constructor,
 * the methods such as setColor,setWidth are invoked ,
 * but in this method we call  _drawRectWithAttrs,
 * and in the method we call add, which is a method can only be called when constructor is over.
 * because before that the property children is a global variable.....
 *
 *
 * conclusion:
 * in setMethod , add method should not be invoked!!!!
 */
LabelRectUnit.prototype._isConstructoring = true
LabelRectUnit.prototype.className = 'LabelRectUnit'
