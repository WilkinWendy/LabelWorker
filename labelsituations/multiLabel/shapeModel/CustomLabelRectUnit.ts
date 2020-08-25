import { LabelRectUnit, LabelRectUnitConfig, LabelPolygon } from 'labelworker'
import { DataInterface } from '../../DataInterface'
import { tools } from 'labelworker'
import { CustomFactoryTypeUnit, PointBase, BusinessUnitBase, BusinessUnit_LabelPolygon } from './interfaces'
export interface CustomLabelRectUnitConfig extends LabelRectUnitConfig {
  meta: {
    typeName: string;
  };
  id: string; // 本id利用了konva的内置查询能力 可使用findOne
}

export class CustomLabelRectUnit extends LabelRectUnit
  implements DataInterface {
  constructor(config: CustomLabelRectUnitConfig) {
    super(config)
    console
  }
  fetchDisplayText(): string {
    const { x, y, width, height } = this.attrs as CustomLabelRectUnitConfig
    return `${Math.round(x)},${Math.round(y)} ${Math.round(
      x + width
    )},${Math.round(y + height)} `
  }
}

CustomLabelRectUnit.prototype.className = 'CustomLabelRectUnit'

// factory

/**
 * CustomLabelRectUnitFactory
 */
export class CustomLabelRectUnitFactory {
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
  }) {
    const { x, y, width, height, typeName } = params
    return new CustomLabelRectUnit({
      x,
      y,
      width,
      height,
      color: this._getColorByType(typeName),
      meta: {
        typeName: typeName
      },
      id: new Date().getTime().toString()
    })
  }

  /**
   * 从业务数据创建CustomLabelRectUnit
   * @param params
   */
  public createCustomLabelRectUnitFromBusiness(
    params: BusinessUnit_CustomLabelRectUnit
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
      typeName: params.name
    }

    return this.createCustomLabelRectUnit(params2)
  }

  /**
   * 从CustomLabelRectUnit创建业务数据
   * @param params
   */
  public createBusinessFromCustomLabelRectUnit(
    rect: CustomLabelRectUnit
  ): BusinessUnit_CustomLabelRectUnit {
    const x = rect.x()
    const y = rect.y()
    const width = rect.width()
    const height = rect.height()
    const typeName: string = rect.getAttr('meta').typeName

    return {
      name: typeName,
      coordinates: [
        { axisX: x, axisY: y, source: 0 },
        { axisX: x + width, axisY: y, source: 0 },
        { axisX: x + width, axisY: y + height, source: 0 },
        { axisX: x, axisY: y + height, source: 0 }
      ],
      source: 0
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
export interface BusinessUnit_CustomLabelRectUnit extends BusinessUnitBase {
  name: string;
  source: 0;
}

