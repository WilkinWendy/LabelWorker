import Konva from 'konva'
import colorArray from './colorArray'

type Stage = Konva.Stage;

export interface SimplePoint {
  x: number;
  y: number;
}

/**
 * 根据序号获取对应颜色池当中的色值
 */
export function getColorByIndex(index: number) {
  if (index < 0) {
    return colorArray[0]
  } else {
    const num = colorArray.length
    const remain = index % num
    return colorArray[remain]
  }
}

/**
 * 获取img
 * @param {*} url
 */
export function getImageObj(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    // img.src = 'http://10.128.122.125:3100/public/timg.jpg?' + Date.now()
    img.onload = function() {
      resolve(img)
    }
    img.onerror = function(params) {
      reject(params)
    }
    img.crossOrigin = 'Anonymous'
    img.src = url
  })
}

/**
   * 根据起始结束位置计算最终rect信息
   * @param startPos 绘制开始点
   * @param endPos 绘制结束点
   */
export function generateRectParams(startPos: SimplePoint, endPos: SimplePoint) {
  return {
    x: startPos.x > endPos.x ? endPos.x : startPos.x,
    y: startPos.y > endPos.y ? endPos.y : startPos.y,
    width: Math.abs(startPos.x - endPos.x),
    height: Math.abs(startPos.y - endPos.y)
  }
}

/**
 * 根据容器的宽高和内容的宽高计算出最合适的宽高缩放比
 * @param {*} containerWidth 容器宽
 * @param {*} containerHeight 容器高
 * @param {*} contentWidth 内容宽
 * @param {*} contentHeight 内容高
 */
export function calcFitRatio(
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number
) {
  const widthRatio = containerWidth / contentWidth
  const heightRatio = containerHeight / contentHeight

  if (widthRatio < heightRatio) {
    return widthRatio
  } else {
    return heightRatio
  }
}

/**
 * 为了适应line在stage scale时候的失真，所有的线都需要乘上这个比例
 * @param {*} stage
 */
export function getLineRatio(stage: Stage) {
  return 1 / stage.scale().x
}

// #region  历史方法收起

// export const rotatePoint = (p: SimplePoint, rad: number) => {
//   const { x, y } = p;
//   const rcos = Math.cos(rad);
//   const rsin = Math.sin(rad);
//   return { x: x * rcos - y * rsin, y: y * rcos + x * rsin };
// };

// /**
//  * Children获取唯一的Text
//  * @param {图形对象} val
//  */
// export function getUniqueText(val) {
//   const childrens = val.getChildren(node => {
//     return node.getClassName() === "Text";
//   });
//   return (childrens.length && childrens[0]) || null;
// }

// /**
//  * Children获取唯一的Tag
//  * @param {图形对象} val
//  */
// export function getUniqueTag(val) {
//   const childrens = val.getChildren(node => {
//     return node.getClassName() === "Tag";
//   });
//   return (childrens.length && childrens[0]) || null;
// }

// /**
//  * Children获取唯一的Line
//  * @param {图形对象} val
//  */
// export function getUniqueLine(val) {
//   const childrens = val.getChildren(node => {
//     return node.getClassName() === "Line";
//   });
//   return (childrens.length && childrens[0]) || null;
// }

// /**
//  * Children获取Circles
//  * @param {图形对象} val
//  */
// export function getUniqueCircles(val) {
//   return val.getChildren(node => {
//     return node.getClassName() === "Circle";
//   });
// }

// /**
//  * 使图形围绕中心点旋转
//  * @param {图形} node
//  * @param {角度} rotation
//  */
// export function rotateAroundCenter(node, rotation) {
//   const centerPoint = { x: -node.width() / 2, y: -node.height() / 2 };
//   const current = rotatePoint(centerPoint, Konva.getAngle(node.rotation()));
//   const rotated = rotatePoint(centerPoint, Konva.getAngle(rotation));
//   const dx = rotated.x - current.x;
//   const dy = rotated.y - current.y;

//   node.rotation(rotation);
//   node.x(node.x() + dx);
//   node.y(node.y() + dy);
// }

// /**
//  * 判断是否是矩形
//  * @param points 多边形的四个点
//  * @returns {boolean} 是否矩形
//  */
// export function isRectByCirclePoints(points: SimplePoint[]) {
//   if (!points || points.length !== 4) {
//     return false;
//   }
//   const x0 = points[0].x;
//   const y0 = points[0].y;
//   const x1 = points[1].x;
//   const y1 = points[1].y;
//   const x2 = points[2].x;
//   const y2 = points[2].y;
//   const x3 = points[3].x;
//   const y3 = points[3].y;

//   const getAngle = (p1: SimplePoint, p2: SimplePoint) => {
//     const { x: a1, y: b1 } = p1;
//     const { x: a2, y: b2 } = p2;

//     const dot = a1 * a2 + b1 * b2;
//     const det = a1 * b2 - b1 * a2;
//     const angle = (Math.atan2(det, dot) / Math.PI) * 180;
//     return 360 - ((angle + 360) % 360);
//   };

//   const angle1 = getAngle(
//     {
//       x: x1 - x0,
//       y: y1 - y0
//     },
//     {
//       x: x1 - x2,
//       y: y1 - y2
//     }
//   );

//   const angle2 = getAngle(
//     {
//       x: x2 - x1,
//       y: y2 - y1
//     },
//     {
//       x: x2 - x3,
//       y: y2 - y3
//     }
//   );

//   return angle1 === 90 && angle2 === 90;
// }

// /**
//  * 判断是否是矩形
//  * @param points 多边形的四个点
//  * @returns {boolean} 是否矩形
//  */
// export function isRectByLinePoints(points: number[]) {
//   if (!points || points.length !== 8) {
//     return false;
//   }
//   const x0 = points[0];
//   const y0 = points[1];
//   const x1 = points[2];
//   const y1 = points[3];
//   const x2 = points[4];
//   const y2 = points[5];
//   const x3 = points[6];
//   const y3 = points[7];

//   const getAngle = (p1: SimplePoint, p2: SimplePoint) => {
//     const { x: a1, y: b1 } = p1;
//     const { x: a2, y: b2 } = p2;

//     const dot = a1 * a2 + b1 * b2;
//     const det = a1 * b2 - b1 * a2;
//     const angle = (Math.atan2(det, dot) / Math.PI) * 180;
//     return 360 - ((angle + 360) % 360);
//   };

//   const angle1 = getAngle(
//     {
//       x: x1 - x0,
//       y: y1 - y0
//     },
//     {
//       x: x1 - x2,
//       y: y1 - y2
//     }
//   );

//   const angle2 = getAngle(
//     {
//       x: x2 - x1,
//       y: y2 - y1
//     },
//     {
//       x: x2 - x3,
//       y: y2 - y3
//     }
//   );

//   return angle1 === 90 && angle2 === 90;
// }

// /**
//  * 判断两点之间的距离是否大于等于3像素
//  */
// export function validPoint(pointA: SimplePoint, pointB: SimplePoint) {
//   return (
//     Math.round(Math.abs(pointA.x - pointB.x)) >= 3 ||
//     Math.round(Math.abs(pointA.y - pointB.y)) >= 3
//   );
// }

// /**
//  * 判断是合法的四边形（每两个点之间的间距符合规定）
//  */
// export function validSizePolygon(points: SimplePoint[]) {
//   if (!points || points.length !== 4) {
//     return false;
//   }
//   return (
//     validPoint(points[0], points[1]) &&
//     validPoint(points[0], points[2]) &&
//     validPoint(points[0], points[3]) &&
//     validPoint(points[1], points[2]) &&
//     validPoint(points[1], points[3]) &&
//     validPoint(points[2], points[3])
//   );
// }

// /**
//  * 判断图形在背景图片内
//  */
// export function polygonInsideImage(
//   points: SimplePoint[],
//   imageWidth: number,
//   imageHeight: number
// ) {
//   return points.every(item => {
//     return (
//       item.x > 0 && item.y > 0 && item.x < imageWidth && item.y < imageHeight
//     );
//   });
// }

// /**
//  * 合法的点集，没有交叉
//  * @param points 点集
//  */
// export function validDivisionPoints(points: SimplePoint[]) {
//   if (!points || points.length <= 2) {
//     return true;
//   }

//   const doublePoints = points.concat(points);

//   let isValid = true;
//   for (let i = 0; i < points.length - 1; i++) {
//     const a = points[i];
//     const b = points[i + 1];

//     for (let j = i; j < points.length; j++) {
//       const c = doublePoints[j + 2];
//       const d = doublePoints[j + 3];
//       const cross = isIntersection(a, b, c, d);
//       if (cross) {
//         isValid = false;
//       }
//     }
//   }
//   return isValid;
// }

// /**
//  * 合法的四边形，没有交叉
//  */
// export function validLookPolygon(points: SimplePoint[]) {
//   if (!points || points.length !== 4) {
//     return false;
//   }
//   const isIntersect1And3 = isIntersection(
//     { x: points[0].x, y: points[0].y },
//     { x: points[1].x, y: points[1].y },
//     { x: points[2].x, y: points[2].y },
//     { x: points[3].x, y: points[3].y }
//   );
//   const isIntersect2And4 = isIntersection(
//     { x: points[1].x, y: points[1].y },
//     { x: points[2].x, y: points[2].y },
//     { x: points[0].x, y: points[0].y },
//     { x: points[3].x, y: points[3].y }
//   );

//   return !isIntersect1And3 && !isIntersect2And4;
// }

// /**
//  * 计算两条直线是否有交叉点
//  * @param a 直线1的端点
//  * @param b 直线1的端点
//  * @param c 直线2的端点
//  * @param d 直线2的端点
//  * @returns {boolean} 是否有相交点
//  */
// export function isIntersection(
//   a: SimplePoint,
//   b: SimplePoint,
//   c: SimplePoint,
//   d: SimplePoint
// ) {
//   // 三角形abc 面积的2倍
//   const area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
//   // 三角形abd 面积的2倍
//   const area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
//   // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);
//   if (area_abc * area_abd >= 0) {
//     return false;
//   }
//   // 三角形cda 面积的2倍
//   const area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
//   // 三角形cdb 面积的2倍
//   // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.
//   const area_cdb = area_cda + area_abc - area_abd;
//   if (area_cda * area_cdb >= 0) {
//     return false;
//   }
//   return true;
// }

// /**
//  * 计算四边形是否顺时针，用夹角计算
//  */
// export function validClockWisePolygon(points: SimplePoint[]) {
//   const x0 = points[0].x;
//   const y0 = points[0].y;
//   const x1 = points[1].x;
//   const y1 = points[1].y;
//   const x2 = points[2].x;
//   const y2 = points[2].y;

//   const getAngle = (p1: SimplePoint, p2: SimplePoint) => {
//     const { x: a1, y: b1 } = p1;
//     const { x: a2, y: b2 } = p2;
//     const dot = a1 * a2 + b1 * b2;
//     const det = a1 * b2 - b1 * a2;
//     const angle = (Math.atan2(det, dot) / Math.PI) * 180;
//     return 360 - ((angle + 360) % 360);
//   };

//   const angle1 = getAngle(
//     {
//       x: x1 - x0,
//       y: y1 - y0
//     },
//     {
//       x: x1 - x2,
//       y: y1 - y2
//     }
//   );

//   // 只用第一个角度即可
//   if (angle1 >= 0 && angle1 <= 180) {
//     return true;
//   } else {
//     return false;
//   }
// }

// /**
//  * 计算字符长度（中文算两个）
//  */
// export function checkTextLength(strTemp: string) {
//   let i, sum;
//   sum = 0;
//   for (i = 0; i < strTemp.length; i++) {
//     if (strTemp.charCodeAt(i) >= 0 && strTemp.charCodeAt(i) <= 255) {
//       sum = sum + 1;
//     } else {
//       sum = sum + 2;
//     }
//   }
//   return sum;
// }

// #endregion

export * from './getRealMousePosFuncBuilder'
export * as eventJudge from './eventJudge'
export * from './PromiseExecutor'
export * from './ShortKeyFactory'

