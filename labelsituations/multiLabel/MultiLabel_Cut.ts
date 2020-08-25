import { LabelWorker, LabelWorkerConfig, LabelRectUnit } from 'labelworker'
import { StageConfig } from 'konva/types/Stage'
import { CustomLabelRectUnit } from './shapeModel/CustomLabelRectUnit'
import { LabelPolygon } from 'labelworker'
import { StageDragPlugin, StageScalePlugin } from '../plugins'
import { MultiLabelBase } from './MultiLabelBase'

import { ReplaySubject } from 'rxjs'
import { minBy, maxBy } from 'lodash-es'
import { clipShape } from '@/package/labelworker/tools/clipShape'
import { Layer } from 'konva/types/Layer'

/**
 * 多类多框场景对象-全图模式
 */
export class MultiLabel_Cut extends MultiLabelBase {
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
  parseData(labelresult:any):{rects:CustomLabelRectUnit[], polygons:LabelPolygon[]} {
    return {
      rects: [],
      polygons: []
    }
  }
  async loadImgSrc(labelResult: Label[], layer: Layer, color: string) {
    const shapes = (labelResult || []).map(o => {
      const minAxisX = +(minBy(o.coordinates, (coord: any) => +coord.axisX)?.axisX || 0)
      const minAxisY = +(minBy(o.coordinates, (coord: any) => +coord.axisY)?.axisY || 0)
      const maxAxisX = +(maxBy(o.coordinates, (coord: any) => +coord.axisX)?.axisX || 0)
      const maxAxisY = +(maxBy(o.coordinates, (coord: any) => +coord.axisY)?.axisY || 0)
      return new LabelRectUnit({
        x: minAxisX,
        y: minAxisY,
        width: maxAxisX - minAxisX,
        height: maxAxisY - minAxisY,
        color,
        draggable: false
      })
    })
    const res = await clipShape({
      stage: this,
      // shapes: shapes.slice(10, 11)
      shapes,
      layer
    })
    return res
  }
}

  interface Label {
  name: string
  source: number
  coordinates: {
    axisX: string
    axisY: string
    classification: number
  }[]
  }
