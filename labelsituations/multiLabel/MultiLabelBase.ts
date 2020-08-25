import {
  LabelWorker,
  LabelWorkerConfig,
  LabelRectUnit,
  tools,
  LabelRectUnitConfig,
  LabelPolygon
} from 'labelworker'
import { StageConfig } from 'konva/types/Stage'
import { Group } from 'konva/types/Group'
import { RectPainter, PolygonPainter } from 'labelworker/painters/index'
import { StageDragPlugin, StageScalePlugin } from '../plugins'
import { ReplaySubject } from 'rxjs'
import { MultiLabelCommonBase } from './MultiLabelCommonBase'
import {
  BusinessUnit_CustomLabelRectUnit,
  CustomLabelRectUnit,
  CustomLabelRectUnitFactory,
  BusinessUnit_LabelPolygon
} from './shapeModel'

/**
 * 多类多框场景对象基类
 */
export class MultiLabelBase extends MultiLabelCommonBase {
  /**
   * 多类多框场景对象
   * 可空只是为了能在.vue 的js块 中初始化出类型
   * @param config Konva初始化配置
   * @param labelworkerConfig labelWorker初始化配置
   */

  // constructor(config: StageConfig, labelworkerConfig: LabelWorkerConfig) {
  //   super(config, labelworkerConfig)
  //   console.log('123')
  // }

  private _datafactory!: CustomLabelRectUnitFactory;

  private dataFactorySubject = new ReplaySubject();

  public registerTypeList(list: string[]) {
    this._datafactory = new CustomLabelRectUnitFactory(list)
    this.dataFactorySubject.next()
  }

  /**
   * 从模型数据转换成业务数据 返回结果就是labelresult
   * @param rects
   * @param Polygons
   */
  getBusinessFromModel(params: {
    rects: CustomLabelRectUnit[];
    polygons: LabelPolygon[];
  }): (BusinessUnit_CustomLabelRectUnit|IgnoreAreaGroup)[] {
    try {
      if (!params) {
        return []
      }

      const busi_polygons = params.polygons.map(item => this._datafactory.createBusinessFromLabelPolygon(item))
      const busi_rects = params.rects.map(item => this._datafactory.createBusinessFromCustomLabelRectUnit(item))
      return [
        ...busi_rects,
        {
          name: 'ignoreArea',
          ignoreAreaCoordinates: busi_polygons
        }
      ]
    } catch (error) {
      console.log('转化异常', params)
      return []
    }
  }

  /**
   * 从业务数据转换成模型数据 别问为什么是一个元素的数组，业务数据就这样
   */
  getModelFromBusiness(
    labelresult: (BusinessUnit_CustomLabelRectUnit|IgnoreAreaGroup)[]
  ): { rects: CustomLabelRectUnit[]; polygons: LabelPolygon[] } {
    // }
    if (!labelresult) {
      return {
        rects: [],
        polygons: []
      }
    }
    try {
      const model_polygons:LabelPolygon[] = []
      const model_rects:CustomLabelRectUnit[] = []

      labelresult.forEach(ele => {
        if (isIgnoreBusinessUnit(ele)) {
          ele.ignoreAreaCoordinates.forEach(item => {
            model_polygons.push(this._datafactory.createLabelPolygonFromBusiness(item))
          })
        } else {
          model_rects.push(this._datafactory.createCustomLabelRectUnitFromBusiness(ele))
        }
      })

      return {
        rects: model_rects,
        polygons: model_polygons
      }
    } catch (error) {
      console.log('转化异常', labelresult)
      return {
        rects: [],
        polygons: [] // todo
      }
    }
  }

  createCustomLabelRectUnit(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    typeName: string;
  }):CustomLabelRectUnit {
    return this._datafactory.createCustomLabelRectUnit(params)
  }
}

interface IgnoreAreaGroup{
  name:'ignoreArea',
  ignoreAreaCoordinates:BusinessUnit_LabelPolygon[]
}

function isIgnoreBusinessUnit(item:BusinessUnit_CustomLabelRectUnit|IgnoreAreaGroup):item is IgnoreAreaGroup {
  return item.name === 'ignoreArea'
}
