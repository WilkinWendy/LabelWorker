import { StageConfig } from 'konva/types/Stage'
import { LabelPolygon, LabelWorkerConfig, tools } from 'labelworker'
import { ReplaySubject, Subject } from 'rxjs'
import { MultiLabelCommonBase } from './MultiLabelCommonBase'
import { BusinessUnit_CustomLinkLabelRectUnit, BusinessUnit_LabelPolygon, CustomLinkLabelRectUnit, CustomLinkLabelRectUnitFactory } from './shapeModel'

/**
 * 多类多框场景对象基类
 */
export class MultiLabelLinkBase extends MultiLabelCommonBase {
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
  // #region datafactory
  private _datafactory!: CustomLinkLabelRectUnitFactory;

  private dataFactorySubject = new ReplaySubject();

  public registerTypeList(list: string[]) {
    this._datafactory = new CustomLinkLabelRectUnitFactory(list)
    this.dataFactorySubject.next()
  }

  public createCustomLabelRectUnit(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    typeName: string;
    groupId:string;
  }):CustomLinkLabelRectUnit {
    return this._datafactory.createCustomLabelRectUnit(params)
  }

  /**
   * 从模型数据转换成业务数据 返回结果就是labelresult
   * @param rects
   * @param Polygons
   */
  getBusinessFromModel(params: {
    rects: CustomLinkLabelRectUnit[];
    polygons: LabelPolygon[];
  }): (BusinessUnit_CustomLinkLabelRectUnit|IgnoreAreaGroup)[] {
    try {
      if (!params) {
        return []
      }

      const busi_polygons = params.polygons.map(item => this._datafactory.createBusinessFromLabelPolygon(item))
      const busi_rects = params.rects.map(item => this._datafactory.createBusinessFromRectUnit(item))
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
    labelresult: (BusinessUnit_CustomLinkLabelRectUnit|IgnoreAreaGroup)[]
  ): { rects: CustomLinkLabelRectUnit[]; polygons: LabelPolygon[] } {
    // }
    if (!labelresult) {
      return {
        rects: [],
        polygons: []
      }
    }
    try {
      const model_polygons:LabelPolygon[] = []
      const model_rects:CustomLinkLabelRectUnit[] = []

      labelresult.forEach(ele => {
        if (isIgnoreBusinessUnit(ele)) {
          ele.ignoreAreaCoordinates.forEach(item => {
            model_polygons.push(this._datafactory.createLabelPolygonFromBusiness(item))
          })
        } else {
          model_rects.push(this._datafactory.createRectUnitFromBusiness(ele))
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

  // #endregion

  // #region  组操作部分

  private _keydownEvent!: (e: KeyboardEvent) => void;
  private _keyupEvent!: (e: KeyboardEvent) => void;
  private _rightClickEvent!: (e: MouseEvent) => void;
  private _moveEvent!: (e: MouseEvent) => void;
  private _upEvent!: (e: MouseEvent) => void;
  private _downEvent!: (e: MouseEvent) => void;

  public Sub_DeleteCurrentGroup:Subject<void> = new Subject()
  public Sub_GroupMove:Subject<{offsetX:number, offsetY:number}> = new Subject()

  private _isGroupKeyInited:boolean = false

  /**
   * 多类多框场景对象
   * 可空只是为了能在.vue 的js块 中初始化出类型
   * @param config Konva初始化配置
   * @param labelworkerConfig labelWorker初始化配置
   */
  constructor(config: StageConfig, labelworkerConfig: LabelWorkerConfig) {
    super(config, labelworkerConfig)
    this.initGroupModeKey()
  }

  parseRectsToGroupList(rects: CustomLinkLabelRectUnit[]): { id: string }[] {
    const arr = rects.map(item => item.attrs.meta.groupId)

    const set = new Set(arr)
    return [...set].map(item => {
      return {
        id: item
      }
    })
  }

  /**
   * 初始化组快捷键
   */
  initGroupModeKey() {
    if (this._isGroupKeyInited) {
      return
    }
    this._isGroupKeyInited = true
    let isListening = false
    window.addEventListener('keydown', (this._keydownEvent = e => {
      if (e.key.toLowerCase() === 'g') {
        if (isListening) {
          return
        }
        isListening = true
        this.startGroupMode()
      }
    }))
    window.addEventListener('keyup', (this._keyupEvent = e => {
      if (e.key.toLowerCase() === 'g') {
        isListening = false
        this.endGroupMode()
      }
    }))
  }

  /**
   * 清除组快捷键
   */
  clearGroupModeKey() {
    if (!this._isGroupKeyInited) {
      return
    }
    this._isGroupKeyInited = false
    window.removeEventListener('keydown', this._keydownEvent)
    window.removeEventListener('keyup', this._keyupEvent)
  }

  /**
   * 进入组模式
   */
  startGroupMode() {
    console.log('触发了startGroupMode', Date.now())
    // 先改变热点区
    this._setIsDrawing(true)
    this.batchDraw()
    const ele = this.container()
    const getPos = tools.getRealMousePosFuncBuilder(this)
    // 添加模式内容
    // 删除sub

    // 这里用mouseup来获取点击事件，因为右键没有点击事件
    ele.addEventListener('mouseup', this._rightClickEvent = e => {
      if (e.button === 2) {
        this.Sub_DeleteCurrentGroup.next()
      }
    })

    let lastPos = { x: 0, y: 0 }
    ele.addEventListener('mousedown', this._downEvent = e => {
      lastPos = getPos()

      ele.addEventListener('mousemove', this._moveEvent = (e) => {
        const nowPose = getPos()
        this.Sub_GroupMove.next({
          offsetX: nowPose.x - lastPos.x,
          offsetY: nowPose.y - lastPos.y
        })
        lastPos = nowPose
        this._markLayer.batchDraw()
      })
    })

    ele.addEventListener('mouseup', this._upEvent = e => {
      ele.removeEventListener('mousemove', this._moveEvent)
    })
  }

  endGroupMode() {
    const ele = this.container()
    console.log('结束了startGroupMode', Date.now())
    // 先改变热点区
    this._setIsDrawing(false)
    this.batchDraw()

    // 取消模式内容
    ele.removeEventListener('mouseup', this._rightClickEvent)
    ele.removeEventListener('mousedown', this._downEvent)
    ele.removeEventListener('mouseup', this._upEvent)
    // ele.removeEventListener('mousemove', this._moveEvent)
  }
  // #endregion

  /**
   * 重写dispose方法
   */
  dispose() {
    super.dispose()
    this.clearGroupModeKey()
  }
}

interface IgnoreAreaGroup{
  name:'ignoreArea',
  ignoreAreaCoordinates:BusinessUnit_LabelPolygon[]
}

function isIgnoreBusinessUnit(item:BusinessUnit_CustomLinkLabelRectUnit|IgnoreAreaGroup):item is IgnoreAreaGroup {
  return item.name === 'ignoreArea'
}
