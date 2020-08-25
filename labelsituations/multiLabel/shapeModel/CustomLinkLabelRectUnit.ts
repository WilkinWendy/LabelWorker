import { LabelRectUnit, LabelRectUnitConfig, LabelPolygon } from 'labelworker'
import { DataInterface } from '../../DataInterface'
import { tools } from 'labelworker'
import {
  CustomFactoryTypeUnit,
  PointBase,
  BusinessUnitBase,
  BusinessUnit_LabelPolygon
} from './interfaces'

export enum CustomLinkLabelRectUnitGroupStatus {
  Selected = 'selected',
  Unselected = 'unselected'
}

export interface CustomLinkLabelRectUnitConfig extends LabelRectUnitConfig {
  meta: {
    typeName: string;
    groupId: string;
  };
  id: string; // 本id利用了konva的内置查询能力 可使用findOne
  groupStatus: CustomLinkLabelRectUnitGroupStatus; // 没有工厂方法的亲
}

export class CustomLinkLabelRectUnit extends LabelRectUnit
  implements DataInterface {
  private _groupStatus: CustomLinkLabelRectUnitGroupStatus =
    CustomLinkLabelRectUnitGroupStatus.Unselected;
  constructor(config: CustomLinkLabelRectUnitConfig) {
    super({ ...config, text: config.meta.groupId }) // 额外根据groupid赋值text
    this._groupStatus = config.groupStatus
    this._changeCurrentGroupStatusStyle()
  }
  fetchDisplayText(): string {
    const { x, y, width, height } = this.attrs as CustomLinkLabelRectUnitConfig
    return `${Math.round(x)},${Math.round(y)} ${Math.round(
      x + width
    )},${Math.round(y + height)} `
  }

  changeGroupStatus(status: CustomLinkLabelRectUnitGroupStatus) {
    this._groupStatus = status
    this._changeCurrentGroupStatusStyle()
  }
  _changeCurrentGroupStatusStyle() {
    const groupStatus = this._groupStatus
    switch (groupStatus) {
      case CustomLinkLabelRectUnitGroupStatus.Selected:
        this._text.fontSize(this.baseStrokeWidth * 10)
        this._text.fontStyle('bold')
        this._lines && this._lines[0] && this._lines[0].setAttrs(
          {
            dash: [10, 5],
            dashEnabled: true
          }
        )
        // // 分辨率文字
        // const text = this.getText()
        // text && text.visible(true)
        break
      case CustomLinkLabelRectUnitGroupStatus.Unselected:
      default:
        this._text.fontSize(this.baseStrokeWidth * 5)
        this._text.fontStyle('normal')
        this._lines && this._lines[0] && this._lines[0].setAttrs(
          {
            dashEnabled: false
          }
        )

        break
    }
  }
}

CustomLinkLabelRectUnit.prototype.className = 'CustomLinkLabelRectUnit'

// factory

/**
 * CustomLinkLabelRectUnitFactory
 */
export class CustomLinkLabelRectUnitFactory {
  private _arr_TypeUnit: CustomFactoryTypeUnit[];
  constructor(typeList: string[]) {
    this._arr_TypeUnit = typeList.map((item, idx) => {
      return {
        typeName: item,
        color: tools.getColorByIndex(idx)
      }
    })
    console.log('colorlist', typeList)
  }

  private _getColorByType(type: string) {
    return this._arr_TypeUnit.find(item => item.typeName === type)?.color || ''
  }

  private _getTypeByColor(color: string) {
    return (
      this._arr_TypeUnit.find(item => item.color === color)?.typeName || ''
    )
  }

  /**
   * 从基本数据创建CustomLabelRectUnit
   * @param params
   */
  public createCustomLabelRectUnit(params: {
    x: number;
    y: number;
    width: number;
    height: number;
    typeName: string;
    groupId: string;
  }) {
    const { x, y, width, height, typeName, groupId } = params
    return new CustomLinkLabelRectUnit({
      x,
      y,
      width,
      height,
      color: this._getColorByType(typeName),
      meta: {
        typeName: typeName,
        groupId: groupId
      },
      id: new Date().getTime().toString(),
      text: groupId,
      groupStatus: CustomLinkLabelRectUnitGroupStatus.Unselected
    })
  }

  /**
   * 从业务数据创建CustomLabelRectUnit
   * @param params
   */
  public createRectUnitFromBusiness(
    params: BusinessUnit_CustomLinkLabelRectUnit
  ) {
    const maxX = Math.max(...params.coordinates.map(item => item.axisX))
    const minX = Math.min(...params.coordinates.map(item => item.axisX))
    const maxY = Math.max(...params.coordinates.map(item => item.axisY))
    const minY = Math.min(...params.coordinates.map(item => item.axisY))

    const params2 = {
      x: minX,
      y: minY,
      height: maxY - minY,
      width: maxX - minX,
      typeName: params.name,
      groupId: params.groupId
    }

    return this.createCustomLabelRectUnit(params2)
  }

  /**
   * 从CustomLabelRectUnit创建业务数据
   * @param params
   */
  public createBusinessFromRectUnit(
    rect: CustomLinkLabelRectUnit
  ): BusinessUnit_CustomLinkLabelRectUnit {
    const x = rect.x()
    const y = rect.y()
    const width = rect.width()
    const height = rect.height()
    const typeName: string = rect.getAttr('meta').typeName
    const groupId: string = rect.getAttr('meta').groupId
    return {
      name: typeName,
      coordinates: [
        { axisX: x, axisY: y, source: 0 },
        { axisX: x + width, axisY: y, source: 0 },
        { axisX: x + width, axisY: y + height, source: 0 },
        { axisX: x, axisY: y + height, source: 0 }
      ],
      source: 0,
      groupId: groupId
    }
  }

  /**
   * 从业务数据创建LabelPolygon
   * @param params
   */
  public createLabelPolygonFromBusiness(
    params: BusinessUnit_LabelPolygon
  ): LabelPolygon {
    const points: number[] = []
    params.coordinates.forEach(({ axisY, axisX }, idx) => {
      points.push(axisX)
      points.push(axisY)
    })
    return new LabelPolygon({
      points,
      stroke: 'black',
      draggable: false,
      radius: 6,
      strokeWidth: 3,
      pointFill: 'black',
      activePointFill: 'yellow',
      activePointRadius: 12,
      closed: true
    })
  }

  /**
   * 从CustomLabelRectUnit创建业务数据
   * @param params
   */
  public createBusinessFromLabelPolygon(
    polygon: LabelPolygon
  ): BusinessUnit_LabelPolygon {
    const pointArray: number[] = polygon.getAbsolutePoints()
    const pointcount = pointArray.length / 2
    const result: PointBase[] = []
    for (let idx = 0; idx < pointcount; idx++) {
      result.push({
        axisX: pointArray[2 * idx],
        axisY: pointArray[2 * idx + 1],
        source: 0
      })
    }
    return {
      coordinates: result
    }
  }
}

/**
 *  业务矩形的业务数据单元
 */
export interface BusinessUnit_CustomLinkLabelRectUnit extends BusinessUnitBase {
  name: string;
  source: 0;
  groupId: string;
}
