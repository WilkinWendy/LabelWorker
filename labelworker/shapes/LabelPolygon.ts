import konva from 'konva'
import {
  ContainerConfig
} from 'konva/types/Container'
import {
  LineConfig
} from 'konva/types/shapes/Line'
import {
  chunk
} from 'lodash-es'
import {
  CircleConfig
} from 'konva/types/shapes/Circle'
import {
  Shape, ShapeConfig, shapes
} from 'konva/types/Shape'
import {
  LabelLine as Line
} from './LabelLine'
import {
  LabelCircle as Circle
} from './LabelCircle'
import { ShapeBaseInterface } from './interface/ShapeBaseInterface'

const INIT_CONF = {
  x: 0,
  y: 0,
  draggable: false
}

export enum LabelPolygonUnitStatus {
  Normal,
  Hover,
  Active
}

export class LabelPolygon extends konva.Group implements ShapeBaseInterface {
  private _hasBindStatusEventRemove = false
  constructor(config?: Config) {
    super(config)
    this.createElement()
  }
  createElement() {
    const {
      points
    } = this.attrs
    this.setAttr('canEdit', true)
    this.setAttr('status', LabelPolygonUnitStatus.Normal)
    const path = new Line(this.getLineAttrs(false))
    const lastPath = new Line(this.getLineAttrs(true))
    chunk<number>(points, 2)
      .forEach((axis, i) => {
        if (axis.length !== 2) return
        const point = new Circle(this.getPointAttrs(axis, i))
        this.add(point)
      })
    this.add(path)
    if (!this.attrs.closed) this.add(lastPath)
  }
  getLineAttrs(isLast: boolean) {
    let statusStyle = {}
    switch (this.attrs.status) {
      case LabelPolygonUnitStatus.Active:
        statusStyle = {
          fill: 'rgba(255, 0, 0, .3)'
        }
        break
      case LabelPolygonUnitStatus.Hover:
        statusStyle = {
          fill: 'rgba(255, 0, 0, .1)'
        }
        break
      case LabelPolygonUnitStatus.Normal:
        statusStyle = {
          fill: 'transparent',
          opacity: 1
        }
        break
    }
    let {
      points
    } = this.attrs
    const { closed } = this.attrs
    points = isLast ? points.slice(points.length - 4) : closed ? points : points.slice(0, points.length - 2)
    return {
      ...statusStyle,
      ...this.attrs,
      ...INIT_CONF,
      name: isLast ? 'lastPath' : 'path',
      dash: [10, 5],
      dashEnabled: isLast,
      points,
      closed
    }
  }
  getPointAttrs([x, y]: number[], i: number) {
    let pointActiveStyle = {}
    const {
      fill,
      pointFill,
      activePointFill,
      activePointRadius
    } = this.attrs
    if (i === 0 && this.attrs.pointActive) {
      pointActiveStyle = {
        fill: activePointFill,
        radius: activePointRadius
      }
    }
    return {
      ...this.attrs,
      ...INIT_CONF,
      x,
      y,
      name: 'LabelCircle',
      fill: pointFill,
      ...pointActiveStyle,
      i
    }
  }
  getAbsolutePoints() {
    return this.attrs.points.map((axis: number, i: number) => {
      const deviation = i % 2 === 0 ? this.x() : this.y()
      return axis + deviation
    })
  }
  setAttr(attr: any, val: any) {
    this.find('.path')[1]?.destroy()
    const canEdit = this.getAttr('canEdit')
    if (typeof canEdit === 'boolean' && !canEdit) return this
    const path = this.findOne('.path')
    const lastPath = this.findOne('.lastPath')
    const points = this.find('.LabelCircle')
    if (attr === 'points' && val.length !== this.attrs.points.length && this.attrs.closed) return this
    super.setAttr(attr, val)
    const axiss = chunk<number>(this.attrs.points, 2)
    if (path) {
      path.setAttrs(this.getLineAttrs(false))
      if (!this.attrs.closed) lastPath.setAttrs(this.getLineAttrs(true))
      else {
        lastPath?.remove()
        if (points.length > axiss.length) points[points.length - 1].remove()
      }
      axiss
        .forEach((axis: number[], i: number) => {
          if (axis.length !== 2) return
          if (points[i]) return points[i].setAttrs(this.getPointAttrs(axis, i))
          const point = new Circle(this.getPointAttrs(axis, i))
          return this.add(point)
        })
    }
    this.getLayer()?.batchDraw()
    return this
  }
  add(shape: konva.Group | Shape<ShapeConfig>) {
    if (shape instanceof konva.Group) return this
    const i = this.attrs.points.length - 2
    switch (shape.getAttr('name')) {
      case 'LabelCircle':
        shape.on('mousedown', ({ evt }) => {
          this.fire('pointmousedown', {
            evt,
            points: [...this.attrs.points],
            i: shape.getAttr('i') * 2
          })
        })
        shape.on('mousemove', function(e) {
          this.setAttr('inner', true)
        })
        shape.on('mouseleave', function(e) {
          this.setAttr('inner', false)
        })
    }
    return super.add(shape)
  }
  startEdit() {
    this.setAttr('draggable', true)
    this.setAttr('canEdit', true)
  }
  endEdit() {
    this.setAttr('draggable', false)
    this.setAttr('canEdit', false)
  }
  bindStatusEvents() {
    this.on('click', () => {
      if (!this.getAttr('closed') || this.getAttr('status') > LabelPolygonUnitStatus.Active) return
      this.setAttr('status', LabelPolygonUnitStatus.Active)
      // 绑定取消状态
      if (this._hasBindStatusEventRemove) return
      this._hasBindStatusEventRemove = true
      this.getStage()?.on('click', (e: any) => {
        if (e.target.parent === this) return
        this.setAttr('status', LabelPolygonUnitStatus.Normal)
      })
    })
    this.getStage()?.on(`click.${this.id}`, (e: any) => {
      if (!this.children.toArray().includes(e.target)) this.setAttr('status', LabelPolygonUnitStatus.Normal)
    })
    this.on('mouseenter', () => {
      if (!this.getAttr('closed') || this.getAttr('status') > LabelPolygonUnitStatus.Hover) return
      this.setAttr('status', LabelPolygonUnitStatus.Hover)
    })
    this.on('mouseleave', () => {
      if (!this.getAttr('closed') || this.getAttr('status') !== LabelPolygonUnitStatus.Hover) return
      this.setAttr('status', LabelPolygonUnitStatus.Normal)
    })
  }
  unbindStatusEvent() {
    this.off('click')
    this.off('mouseenter')
    this.off('mouseleave')
    this.getStage()?.off(`click.${this.id}`)
  }
  outRange() {
    const points: number[] = this.getAbsolutePoints()
    const bkg = this.getStage()?.findOne('.bkg')
    let f = false
    points.forEach((point, i) => {
      if (i % 2 === 0) {
        if (point < 0 || point > bkg.width()) f = true
      } else {
        if (point < 0 || point > bkg.height()) f = true
      }
    })
    return f
  }
}

LabelPolygon.prototype.className = 'LabelPolygon'

interface Config extends ContainerConfig, LineConfig, CircleConfig {
  canEdit?: boolean
  status?: LabelPolygonUnitStatus
  pointFill?: string
  pointActive?: boolean
  activePointFill?: string
  activePointRadius?: number
}
