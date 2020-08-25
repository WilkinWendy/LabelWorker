import konva from 'konva'
import { Group } from 'konva/types/Group'
import { Layer } from 'konva/types/Layer'
import { Shape } from 'konva/types/Shape'
import { Stage } from 'konva/types/Stage'
import { LabelWorker } from '..'

/**
 * 将shape导出为base64
 *
 * @export
 * @param {(Shape | Group)} shape
 */
export async function clipShape({
  stage = window.situation,
  shapes = [],
  group = false,
  layer,
  containerWidth = 300,
  containerHeight = 500
}: ClipConfig): Promise<ClipRes[]> {
  if (!stage) return []
  if (!group && shapes.length > 5) console.warn(`一次截取过多图形会造成卡顿，当前图形数：${shapes.length}`)
  const PADDING = 20
  // #region 模拟shape
  // shapes = [
  //   new LabelPolygon({
  //     x: 30,
  //     y: 30,
  //     points: [20, 20, 40, 40, 10, 60],
  //     draggable: false,
  //     color: 'yellow',
  //     radius: 4,
  //     closed: true
  //   })
  // ]
  // shapes[0] = new LabelRectUnit({
  //   x: 345,
  //   y: 160,
  //   width: 100,
  //   height: 200,
  //   draggable: false,
  //   color: 'yellow'
  // })
  // #endregion
  const cacheStage = getCacheStage()
  let tl: Layer = cacheStage.findOne('Layer')
  if (!tl) {
    tl = new konva.Layer()
    cacheStage.add(tl)
  }
  let img: konva.Image = (cacheStage.findOne('Layer') as Layer)?.findOne('Image')
  const newImg = (stage?.findOne('.img') as Layer)?.findOne('Image')
  if (!newImg) return []
  if (newImg?.width() && newImg?.height()) {
    img = new konva.Image(newImg?.getAttrs())
    tl?.add(img)
  }
  if (!img) return []
  const res: ClipRes[] = []
  if (group) {
    const group = new konva.Group()
    shapes.forEach(shape => group.add(shape))
    shapes = [group]
  }
  for (let i = 0; i < shapes.length; i++) {
    const shape: Shape | Group = shapes[i]?.clone()
    const rectInner = shape.getClientRect({
      skipTransform: false
    })
    let scale = 1
    if (rectInner.width / rectInner.height > containerWidth / containerHeight) {
      scale = containerWidth / (rectInner.width + PADDING * 2)
    } else {
      scale = containerHeight / (rectInner.height + PADDING * 2)
    }
    if (Number.isNaN(scale)) return res
    cacheStage.width(img.width() * scale)
    cacheStage.height(img.height() * scale)
    cacheStage.scale({
      x: scale / window.devicePixelRatio,
      y: scale / window.devicePixelRatio
    })
    if (layer) {
      layer.children.each(shape => {
        tl.add(shape.clone())
      })
    } else {
      tl.add(shape)
    }
    tl?.draw()
    const src = tl?.getCanvas().toDataURL('image/webp', 0.1)
    const target = await clipImage(
      src,
      rectInner.x * scale - PADDING,
      rectInner.y * scale - PADDING,
      rectInner.width * scale + PADDING * 2,
      rectInner.height * scale + PADDING * 2
    )
    res[i] = {
      ...rectInner,
      scale,
      src: target
    }
    shape.destroy()
  }
  return res
}

/**
 * 截取图片
 *
 * @export
 * @param {string} srcUrl
 * @param {number} startX
 * @param {number} startY
 * @param {number} width
 * @param {number} height
 * @returns
 */
export function clipImage(srcUrl: string, startX: number, startY: number, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const srcImg = new Image()
    srcImg.crossOrigin = 'Anonymous'
    srcImg.src = srcUrl
    srcImg.decoding = 'async'
    srcImg.onload = function name(params) {
      const canvas = document.createElement('canvas')
      canvas.height = height
      canvas.width = width
      const canvasContext = canvas.getContext('2d')
      const { devicePixelRatio } = window
      canvasContext?.drawImage(
        srcImg,
        startX,
        startY,
        width,
        height,
        0,
        0,
        width,
        height
      )
      const dataUrl = canvas.toDataURL('image/webp', 0.1)
      resolve(dataUrl)
    }
  })
}

function getCacheStage() {
  let cacheStage = window.$cacheStage
  if (!cacheStage) {
    let cacheStageContainer: HTMLDivElement | null = document.querySelector('.cache-stage-container')
    if (!cacheStageContainer) {
      cacheStageContainer = document.createElement('div')
      document.body.appendChild(cacheStageContainer)
      cacheStageContainer.className += 'cache-stage-container'
      cacheStageContainer.style.position = 'fixed'
      cacheStageContainer.style.zIndex = '-100'
      cacheStageContainer.style.opacity = '0'
      cacheStageContainer.style.top = '0'
      cacheStageContainer.style.left = '0'
      cacheStageContainer.style.overflow = 'auto'
    }
    cacheStage = window.$cacheStage = new konva.Stage({
      container: cacheStageContainer
    })
  }
  return cacheStage
}

interface ClipConfig {
  shapes: (Shape | Group)[]
  stage?: Stage
  group?: boolean
  layer?: Layer
  containerWidth?: number
  containerHeight?: number
}

interface ClipRes {
  src: string
  scale: number
  x: number
  y: number
  width: number
  height: number
}

declare global {
  interface Window {
    situation: LabelWorker
    $cacheStage?: Stage
  }
}
