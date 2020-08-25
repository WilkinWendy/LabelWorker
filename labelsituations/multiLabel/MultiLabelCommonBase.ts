import { PromiseExecutor } from '@/package/labelworker/tools'
import Konva from 'konva'
import { StageConfig } from 'konva/types/Stage'
import { LabelPolygon, LabelRectUnit, LabelWorker, LabelWorkerConfig, PolygonPainter, RectPainter, tools } from 'labelworker'
import { StageDeepSelectPlugin, StageDisableContextMenuPlugin } from '../plugins'

/**
 * 多类多框场景对象基类
 */
export class MultiLabelCommonBase extends LabelWorker {
  protected isRegistRanging:boolean = false
  /**
   * 多类多框场景对象
   * 可空只是为了能在.vue 的js块 中初始化出类型
   * @param config Konva初始化配置
   * @param labelworkerConfig labelWorker初始化配置
   */

  constructor(config: StageConfig, labelworkerConfig: LabelWorkerConfig) {
    super(config, labelworkerConfig)
    const _this = this
    this.installPlugin(new StageDisableContextMenuPlugin())
    this.installPlugin(
      new StageDeepSelectPlugin({
        selectProperNode(): LabelRectUnit {
          const rects_all: LabelRectUnit[] = _this._markLayer.children
            .toArray()
            .filter(
              item => item instanceof LabelRectUnit
            ) as LabelRectUnit[]
          // 指定查找范围

          const { x, y } = tools.getRealMousePosFunc(_this)
          const rects = rects_all.filter(item => {
            return (
              x > item.x() &&
              y > item.y() &&
              x < item.x() + item.width() &&
              y < item.y() + item.height()
            )
          })

          // 查找最小面基
          let currentMinObj = rects[0]
          if (currentMinObj) {
            let currentArea = rects[0].width() * rects[0].height()
            for (let index = 0; index < rects.length; index++) {
              const item = rects[index]
              const area = item.width() * item.height()
              if (area < currentArea) {
                currentMinObj = item
                currentArea = area
              }
            }
            currentMinObj.zIndex(rects_all.length)
          }

          return currentMinObj
        }
      })
    )
    this.registRange()
  }

  /**
   * (未返回结果)绘制一个指定颜色的矩形框到标注层
   * @param color
   * @returns 无返回值的Promise
   */
  async drawRectWithColor(color: string): Promise<void> {
    const painter = new RectPainter({
      bufferLayer: this._bufferLayer,
      color: color
    })

    const action = painter.drawOne()

    // // 这是一次手动终止测试
    // setTimeout(() => {
    //   action.dispose("萌萌哒的一次终止");
    // }, 5000);

    try {
      const rect = await action.getResult()
      this._markLayer.add(rect)
      this._markLayer.batchDraw()
    } catch (error) {
      console.log(error.message)
    }
  }

  /**
   * 获取单绘并添加到stage 的 action，目前只用于业务的特殊连绘模式
   * 注：特殊连绘模式是相对于一般连绘模式来说的，
   * 一般连绘模式：一次性画多个图，一旦取消action，全体图形revert
   * 特殊连绘模式：一次性画多个图，一旦取消action，只revert最新那个。这本质上是一种多次单绘action拼接而成的特殊连绘action
   * @param idx
   * @param wrapperFunc
   */
  getAction_DrawRectWithIndex<T extends LabelRectUnit>(
    idx: number,
    wrapperFunc: (obj: LabelRectUnit) => T
  ) {
    // 内部action
    let currenInnerAction:PromiseExecutor<LabelRectUnit>

    const layer = this._markLayer
    const color = tools.getColorByIndex(idx)
    const painter = new RectPainter({
      bufferLayer: this._bufferLayer,
      color: color
    })
    return new PromiseExecutor<T>(
      async(resolve, reject) => {
        const action = currenInnerAction = painter.drawOne()
        action.name = 'drawRectWithIndexInner'

        try {
          // 获取结果
          const rect = await action.getResult()

          // 包装成新业务对象
          const wrappedRect = wrapperFunc ? wrapperFunc(rect) : rect.clone()

          // 在标注层中添加
          layer.add(wrappedRect)

          // 原图形内存占用，故销毁
          rect.destroy()

          // 绘制
          layer.batchDraw()

          // 返回，供外部使用
          resolve(wrappedRect)
        } catch (e) {
          reject(e)
        } finally {
          this.batchDraw()
        }
      },
      (reason) => {
        currenInnerAction?.dispose('getAction_DrawRectWithIndex currenInnerAction 终止')
      },
      () => {}
    )
  }

  getAction_drawPolygenWithCurrentType():PromiseExecutor<LabelPolygon> {
    // 内部action
    let currenInnerAction:PromiseExecutor<LabelPolygon>

    const layer = this._markLayer
    const painter = new PolygonPainter({
      bufferLayer: this._bufferLayer
    })
    return new PromiseExecutor<LabelPolygon>(
      async(resolve, reject) => {
        const action = currenInnerAction = painter.drawOne()
        action.name = 'drawPolygonInner'

        try {
          // 获取结果
          const polygon = await action.getResult()

          // 包装成新业务对象
          const wrappedRect = polygon.clone()

          // 在标注层中添加
          layer.add(wrappedRect)

          // 原图形内存占用，故销毁
          polygon.destroy()

          // 绘制
          layer.batchDraw()
          // 返回，供外部使用
          resolve(wrappedRect)
        } catch (e) {
          reject(e)
        } finally {
          this.batchDraw()
        }
      },
      (reason) => {
        currenInnerAction?.dispose('getAction_drawPolygenWithCurrentType currenInnerAction 终止')
      },
      () => {}
    )
    // const painter = new PolygonPainter({
    //   bufferLayer: this._bufferLayer
    // })
    // const action = painter.drawOne()
    // this.setCurrentAction(action)
    // this._setIsDrawing(true)
    // try {
    //   let shape = await action.getResult()
    //   console.log('多边形绘制完成，准备添加')
    //   shape = shape.clone()
    //   this._markLayer.add(shape)
    //   painter._bindEvents(shape)
    //   this._markLayer.batchDraw()
    //   return shape
    // } finally {
    //   this._setIsDrawing(false)
    //   this.batchDraw()
    // }
  }

  /**
   * 根据idx获取颜色后画框
   * @param idx 颜色序列
   * @param wrapperFunc 包装函数
   */
  async drawRectWithIndex<T extends LabelRectUnit>(
    idx: number,
    wrapperFunc: (obj: LabelRectUnit) => T,
    layer: Konva.Layer = this._markLayer
  ): Promise<T> {
    const color = tools.getColorByIndex(idx)
    const painter = new RectPainter({
      bufferLayer: this._bufferLayer,
      color: color
    })

    const action = painter.drawOne()
    action.name = 'drawRectWithIndex'

    this.setCurrentAction(action)
    this._setIsDrawing(true)

    // // 这是一次手动终止测试
    // setTimeout(() => {
    //   action.dispose("萌萌哒的一次终止");
    // }, 5000);

    try {
      // 获取结果
      const rect = await action.getResult()
      console.log(rect)
      // 包装成新业务对象
      const wrappedRect = wrapperFunc ? wrapperFunc(rect) : rect.clone()

      // 在标注层中添加
      layer.add(wrappedRect)

      // 原图形内存占用，故销毁
      rect.destroy()

      // 绘制
      layer.batchDraw()
      this._setIsDrawing(false)
      // 返回，供外部使用
      return wrappedRect
    } catch (e) {
      this._setIsDrawing(false)
      throw e
    } finally {
      this.batchDraw()
    }
  }

  // 编辑指定shape
  startEditRect(shape: LabelRectUnit) {
    shape.startEdit()
  }

  endEditRect(shape: LabelRectUnit) {
    shape.endEdit()
  }

  async drawPolygenWithCurrentType() {
    const painter = new PolygonPainter({
      bufferLayer: this._bufferLayer
    })
    const action = painter.drawOne()
    this.setCurrentAction(action)
    this._setIsDrawing(true)
    try {
      let shape = await action.getResult()
      console.log('多边形绘制完成，准备添加')
      shape = shape.clone()
      this._markLayer.add(shape)
      painter._bindEvents(shape)
      this._markLayer.batchDraw()
      return shape
    } finally {
      this._setIsDrawing(false)
      this.batchDraw()
    }
  }

  baseFunc?: () => void
  rangeFunc?: () => void

  /**
   * 开启校验图形是否在范围内，依赖于图形实现outRange给出校验结果
   *
   * @memberof MultiLabelCommonBase
   */
  registRange() {
    if (this.isRegistRanging) {
      return
    }
    this.isRegistRanging = true
    if (this.baseFunc || this.rangeFunc) return
    this.baseFunc = () => {
      if (this._markLayer.children.length === 0) return
      const cache: {
        [k: string]: any
      } = {}
      this._markLayer.children.each(shape => (cache[shape._id] = { ...shape.getAttrs() }))
      this.setAttr('rangeCache', cache)
    }
    this.rangeFunc = () => {
      if (this._markLayer.children.length === 0) return
      const cache = this.getAttr('rangeCache') || {}
      this._markLayer.children.each((shape: any) => {
        if (shape?.outRange()) {
          if (cache[shape._id]) {
            shape.setAttrs(cache[shape._id])
            // 连续绘制情况下需要对上一次绘制进行校验（比如多边形）
            if (shape.outRange()) {
              this.fire('outrange', {
                id: shape._id
              })
              shape.destroy()
            }
          } else {
            this.fire('outrange', {
              id: shape._id
            })
            shape.destroy()
          }
        }
      })
      this.batchDraw()
      this.setAttr('rangeCache', {})
    }
    window.addEventListener('mousedown', this.baseFunc)
    window.addEventListener('mouseup', this.rangeFunc)
  }

  unregistRange() {
    if (!this.isRegistRanging) {
      return
    }
    this.isRegistRanging = false
    if (this.baseFunc) window.removeEventListener('mousedown', this.baseFunc)
    if (this.rangeFunc) window.removeEventListener('mouseup', this.rangeFunc)
  }

  dispose() {
    super.dispose()
    this.unregistRange()
  }
}
