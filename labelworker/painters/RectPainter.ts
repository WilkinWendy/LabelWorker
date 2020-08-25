import { LabelRectUnit, LabelRectUnitStatus } from '../shapes/index'
import { PromiseExecutor } from '../tools'
import Konva from 'konva'
import {
  SimplePoint,
  getRealMousePosFuncBuilder,
  eventJudge,
  generateRectParams
} from '../tools'
import { Stage } from 'konva/types/Stage'
import { template } from 'lodash-es'
type Layer = Konva.Layer;

export interface RectPainterConfig {
  // 临时绘制图层
  bufferLayer: Layer;
  color: string;
}

/**
 * 矩形绘制器
 */
export class RectPainter {
  private _isDrawing: boolean = false;
  private _bufferLayer!: Layer;
  private _color!: string;

  /**
   * 设置当前绘制器颜色
   * @param val
   */
  setColor(val: string) {
    return val
  }

  /**
   * 获取当前绘制器颜色
   */
  getColor() {
    return this._color
  }

  constructor(config: RectPainterConfig) {
    this._bufferLayer = config.bufferLayer
    this._color = config.color
  }

  /**
   *返回 一个矩形绘制器
   */
  drawOne() {
    return this._singleDraw()
  }

  // /**
  //  * 返回一个矩形编辑器
  //  * @param shape
  //  */
  // edit(shape: LabelRectUnit): PromiseExecutor<LabelRectUnit> {
  //   const _this = this
  //   return new PromiseExecutor<LabelRectUnit>(
  //     function(resolve, reject) {
  //       // resolve用于返回结果
  //       // reject用于返回内部异常
  //       // 在缓冲层编辑，完成后返回
  //       resolve(shape)
  //     },
  //     function(reason) {
  //       // 编辑失败后，包括内部异常和外部取消
  //     },
  //     function() {
  //       // finally
  //     }
  //   )
  // }

  /**
   * 绘制矩形的单元方法
   * 期望的是只有鼠标拖动，键盘没有按键
   */
  _singleDraw(): PromiseExecutor<LabelRectUnit> {
    const _this = this
    let tmprect!: LabelRectUnit
    let DEBUG:number
    return new PromiseExecutor(
      function(resolve, reject) {
        DEBUG = Date.now()
        const _drawingLayer = _this._bufferLayer
        const stage = _drawingLayer.getStage() as Stage
        console.log(DEBUG, '_singleDraw 绑定了事件')
        stage.on('mousedown.rectMouseDown', e => {
          // 只监听鼠标左键
          if (!eventJudge.isOnlyLeftMouseKey(e.evt)) {
            _drawingLayer.destroyChildren()
            _drawingLayer.draw()
            reject(new Error('mousemove非法按键'))
            return
          }

          const getRealMousePos = getRealMousePosFuncBuilder(
            _drawingLayer.getStage()
          )
          const startPos = getRealMousePos()

          // 开启监听Move
          stage.on('mousemove.rectMouseMove', e => {
            if (!eventJudge.isOnlyLeftMouseKey(e.evt)) {
              reject(new Error('mousemove非法按键'))
              return
            }
            const endPos = getRealMousePos()
            const config = generateRectParams(startPos, endPos)
            tmprect?.destroy()
            tmprect = new LabelRectUnit({
              ...config,
              status: LabelRectUnitStatus.Normal,
              color: _this._color,
              draggable: false
            })

            _this._bufferLayer.add(tmprect)
            _this._bufferLayer.batchDraw()
          })
        })

        // 开启监听Up
        stage.on('mouseup.rectMouseUp', e => {
          if (tmprect) {
            tmprect?.remove()
            resolve(tmprect)
          } else {
            reject(new Error('绘制异常'))
          }
        })
      },
      function(reason) {
        // 这里有一点需要注意的 shape.remove() 是指shape从当前shape的父节点移除，并未销毁
        // 故，如果remove在一个遥远事件循环中调用了，而在之前又add到新的layer中，这会导致shape在新层中被移除
        // 在当前场景中 虽然resolve和reject 都有 remove ，但不可全部移除放置到 finally中，原因就是finally的执行时机比较靠后
        tmprect?.remove()
      },
      function() {
        console.log(DEBUG, '_singleDraw finally完结，正在移除绑定事件')
        const _bufferLayer = _this._bufferLayer
        const stage = _bufferLayer.getStage() as Stage
        stage.off('mousedown.rectMouseDown')
        stage.off('mouseup.rectMouseUp')
        stage.off('mousemove.rectMouseMove')
        _bufferLayer.batchDraw()
      }
    )
  }
}
