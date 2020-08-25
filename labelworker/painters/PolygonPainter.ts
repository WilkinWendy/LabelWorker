import Konva from 'konva'
import { Stage } from 'konva/types/Stage'
import { LabelPolygon } from '../shapes/index'
import { getRealMousePosFunc, PromiseExecutor } from '../tools'

export interface PolygonPainterConfig {
  // 临时绘制图层
  bufferLayer: Konva.Layer
}

/**
 * 多边形绘制器
 *
 * @export
 * @class PolygonPainter
 */
export class PolygonPainter {
  _bufferLayer: Konva.Layer

  constructor(config: PolygonPainterConfig) {
    this._bufferLayer = config.bufferLayer
  }

  drawOne() {
    return this._singleDraw()
  }

  _singleDraw() {
    const _this = this
    let shape: LabelPolygon
    const ns = Date.now()
    let res: Function = () => 0
    function closeShape(e: any) {
      if (e.code === 'Space') {
        const points = shape.getAttr('points')
        shape.setAttr('points', points.slice(0, points.length - 2))
        shape.setAttr('closed', true)
        if (res) {
          res(shape)
          shape.remove()
        }
      }
    }
    return new PromiseExecutor<LabelPolygon>(
      function(resolve, reject) {
        shape = new LabelPolygon({
          points: [],
          stroke: 'black',
          draggable: false,
          radius: 6,
          strokeWidth: 3,
          pointFill: 'black',
          activePointFill: 'yellow',
          activePointRadius: 12
        })
        _this._bindEvents(shape, ns, resolve)
        res = resolve
        window.addEventListener('keyup', closeShape)
        _this._bufferLayer.add(shape)
        _this._bufferLayer.batchDraw()
      },
      function() {
        const _bufferLayer = _this._bufferLayer
        const stage = _bufferLayer.getStage() as Stage
        if (shape) shape.remove()
        stage.off('mouseup.' + ns)
        stage.off('mousemove.' + ns)
      },
      function() {
        const _bufferLayer = _this._bufferLayer
        const stage = _bufferLayer.getStage() as Stage
        stage.off('mouseup.' + ns)
        stage.off('mousemove.' + ns)
        window.removeEventListener('keyup', closeShape)
        _bufferLayer.batchDraw()
      }
    )
  }

  _bindEvents(shape: LabelPolygon, ns: number = Date.now(), resolve?: Function) {
    const _drawingLayer = shape.getLayer() || this._bufferLayer
    const stage = _drawingLayer.getStage() as Stage
    let canDrag = false
    // 解决连续绘制时上一个mouseup误触当前绘制的问题
    let init = false
    let targetPoints: number[] = []
    let dragTaget: {
        points: number[]
        i: number
      } = {
        points: [],
        i: 0
      }
    stage.on('mousedown.' + ns, () => {
      init = true
    })
    stage.on('mouseup.' + ns, e => {
      if (!init) return
      init = false
      canDrag = false
      const points = shape.getAttr('points')
      if (points.length <= 2) {
        const { x, y } = getRealMousePosFunc(stage)
        shape.setAttr('points', [x, y])
      }
      if (shape.getAttr('closed')) shape.setAttr('draggable', true)
      stage.batchDraw()
      targetPoints = shape.getAttr('points')
    })
    stage.on('mousemove.' + ns, e => {
      if (targetPoints.length >= 2) {
        let x: number, y: number
        const realPos = getRealMousePosFunc(stage)
        x = realPos.x
        y = realPos.y
        if (shape.getAttr('pointActive')) {
          const points = shape.getAttr('points')
          x = points[0]
          y = points[1]
        }
        // 第一个点是否高亮显示
        const pointActive = targetPoints.length >= 6 && Math.sqrt(Math.pow(targetPoints[0] - realPos.x, 2) + Math.pow(targetPoints[1] - realPos.y, 2)) < shape.getAttr('radius') + 10
        if (!shape.getAttr('closed')) shape.setAttr('pointActive', pointActive)
        shape.setAttr('points', [...targetPoints, x, y])
        if (canDrag) {
          let { i } = dragTaget
          if (i === dragTaget.points.length) i = 0
          dragTaget.points.splice(i, 2, x - shape.x(), y - shape.y())
          shape.setAttr('points', dragTaget.points)
        }
        stage.batchDraw()
      }
    })
    shape.on('pointmousedown', (e: any) => {
      dragTaget = e
      if (e.points.length > 4 && shape.getAttr('pointActive')) {
        const points = shape.getAttr('points')
        shape.setAttr('points', points.slice(0, points.length - 2))
        shape.setAttr('pointActive', false)
        shape.setAttr('draggable', true)
        shape.setAttr('closed', true)
        if (resolve) {
          resolve(shape)
          shape.remove()
        }
      }
      if (shape.getAttr('closed')) {
        shape.setAttr('draggable', false)
        canDrag = true
      }
      stage.batchDraw()
    })
    shape.bindStatusEvents()
  }
}
