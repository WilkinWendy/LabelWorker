import { LabelWorker, LabelWorkerConfig } from 'labelworker'
import { StageConfig } from 'konva/types/Stage'
import { CustomLabelRectUnit } from './shapeModel/CustomLabelRectUnit'
import { LabelPolygon } from 'labelworker'
import { StageDragPlugin, StageScalePlugin } from '../plugins'
import { MultiLabelBase } from './MultiLabelBase'

import { ReplaySubject } from 'rxjs'
import {
  CustomLabelRectUnitFactory,
  BusinessUnit_CustomLabelRectUnit
} from './shapeModel/CustomLabelRectUnit'
/**
 * 多类多框场景对象-全图模式
 */
export class MultiLabel_Full extends MultiLabelBase {
  /**
   * 多类多框场景对象
   * 可空只是为了能在.vue 的js块 中初始化出类型
   * @param config Konva初始化配置
   * @param labelworkerConfig labelWorker初始化配置
   */

  constructor(config: StageConfig, labelworkerConfig: LabelWorkerConfig) {
    super(config, labelworkerConfig)

    this.installPlugin(new StageDragPlugin({ markLayer: this._markLayer }))
    this.installPlugin(new StageScalePlugin())
  }
}
