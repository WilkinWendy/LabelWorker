
export interface CustomFactoryTypeUnit {
  typeName: string;
  color: string;
}

export interface BusinessUnitBase {
  coordinates: PointBase[];
}
export interface PointBase {
  axisX: number;
  axisY: number;
  source?: 0;
}

/**
 *  多边形的业务数据单元
 */
export interface BusinessUnit_LabelPolygon extends BusinessUnitBase {

}