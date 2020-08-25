import { LabelWorker, LabelWorkerConfig, LabelRectUnit } from 'labelworker'
import { StageConfig } from 'konva/types/Stage'
import { CustomLinkLabelRectUnit, CustomLinkLabelRectUnitGroupStatus } from './shapeModel/CustomLinkLabelRectUnit'
import { LabelPolygon } from 'labelworker'
import { StageDragPlugin, StageScalePlugin } from '../plugins'
import { MultiLabelLinkBase } from './MultiLabelLinkBase'

import { ReplaySubject } from 'rxjs'
import { minBy, maxBy } from 'lodash-es'
import { clipShape } from '@/package/labelworker/tools/clipShape'
import { Layer } from 'konva/types/Layer'

/**
 * 多类多框场景对象-全图模式
 */
export class MultiLabelLink_Cut extends MultiLabelLinkBase {
  /**
   * 多类多框场景对象
   * 可空只是为了能在.vue 的js块 中初始化出类型
   * @param config Konva初始化配置
   * @param labelworkerConfig labelWorker初始化配置
   */

  // constructor(config: StageConfig, labelworkerConfig: LabelWorkerConfig) {
  //   super(config, labelworkerConfig)
  //   this.installPlugin(new StageDragPlugin())
  //   this.installPlugin(new StageScalePlugin())
  // }

  /**
   * 转换labelResult
   */
  parseData(labelresult:any):{rects:CustomLinkLabelRectUnit[], polygons:LabelPolygon[]} {
    return {
      rects: [],
      polygons: []
    }
  }
  async loadImgSrc(labelResult: Label[], layer: Layer, color: string, group = false) {
    const shapes = (labelResult || []).map(o => {
      const minAxisX = +(minBy(o.coordinates, (coord: any) => +coord.axisX)?.axisX || 0)
      const minAxisY = +(minBy(o.coordinates, (coord: any) => +coord.axisY)?.axisY || 0)
      const maxAxisX = +(maxBy(o.coordinates, (coord: any) => +coord.axisX)?.axisX || 0)
      const maxAxisY = +(maxBy(o.coordinates, (coord: any) => +coord.axisY)?.axisY || 0)
      const shape = new CustomLinkLabelRectUnit({
        x: minAxisX,
        y: minAxisY,
        width: maxAxisX - minAxisX,
        height: maxAxisY - minAxisY,
        color: o.color || color,
        draggable: true,
        meta: {
          typeName: o.name,
          groupId: o.groupId
        },
        id: new Date().getTime() + '',
        groupStatus: CustomLinkLabelRectUnitGroupStatus.Selected
      })
      if (o.hide) shape.hide()
      return shape
    })
    const res = await clipShape({
      stage: this,
      // shapes: shapes.slice(10, 11)
      shapes,
      layer,
      group
    })
    return {
      ...res,
      shapes
    }
  }
}

interface Label {
  name: string
  source: number
  color?: string
  groupId: string
  hide?: boolean
  coordinates: {
    axisX: string
    axisY: string
    classification: number
  }[]
}
