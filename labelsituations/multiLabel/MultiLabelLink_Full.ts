import { StageConfig } from 'konva/types/Stage'
import { LabelWorkerConfig } from 'labelworker'
import { StageDragPlugin, StageScalePlugin } from '../plugins'
import { MultiLabelLinkBase } from './MultiLabelLinkBase'
/**
 * 多类多框场景对象-有关联-全图模式
 */
export class MultiLabelLink_Full extends MultiLabelLinkBase {
  constructor(config: StageConfig, labelworkerConfig: LabelWorkerConfig) {
    super(config, labelworkerConfig)
    this.installPlugin(new StageDragPlugin({ markLayer: this._markLayer }))
    this.installPlugin(new StageScalePlugin())
  }
}
