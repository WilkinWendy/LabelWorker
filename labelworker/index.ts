import Konva from 'konva'
import { StageConfig } from 'konva/types/Stage'
import { addListener } from 'resize-detector'
import {
  getImageObj,
  calcFitRatio,
  ShortKeyFactory,
  ShortKeyFactoryKeyUnit,
  PromiseExecutor
} from './tools'
import { LocationPainter } from './painters'
import { ReplaySubject } from 'rxjs'
import { Shape } from 'konva/types/Shape'
import Water from '@/assets/images/water.png'

const Stage = Konva.Stage
const Layer = Konva.Layer
const Image = Konva.Image

export interface LabelWorkerConfig {
  /**
   * stage容器是否随父元素自适应
   */
  autofit: boolean;

  /**
   * 图片是否自适应
   */
  imageAutofit: boolean;

  /**
   * 水印图片URL
   */
  waterUrl?: string;
}

const LabelWorkerConfig_DETAULT: LabelWorkerConfig = {
  autofit: false,
  imageAutofit: false
}

class LabelWorker extends Stage {
  protected plugins: PluginInterface[] = [];

  /**
   * 底图层
   */
  protected _imgLayer = new Layer({
    name: 'img'
  });
  /**
   * 缓冲层
   */
  protected _bufferLayer = new Layer();
  /**
   * 标注层
   */
  protected _markLayer = new Layer();

  /**
   * 十字准星定位层（因为出现比较平凡，故而专门独立一个）
   */
  protected _locationLayer = new Layer();

  protected _imgUrl: string = '';

  protected config_labelworker!: LabelWorkerConfig;
  protected config_stageConfig!: StageConfig;

  protected _locationPainter!: LocationPainter;

  /**
   * 快捷键代理工厂
   */
  protected _shortKeyFactory: ShortKeyFactory = new ShortKeyFactory();

  constructor(
    config: StageConfig,
    labelWorkerConfig: LabelWorkerConfig = LabelWorkerConfig_DETAULT
  ) {
    super(config)
    this.config_stageConfig = config
    this.config_labelworker = labelWorkerConfig
    this.add(this._imgLayer)
    this.add(this._bufferLayer)
    this.add(this._markLayer)
    this.add(this._locationLayer)
    this._imgLayer.zIndex(0)
    this._markLayer.zIndex(1)
    this._locationLayer.zIndex(2)
    this._bufferLayer.zIndex(3)

    this._locationPainter = new LocationPainter({
      color: 'red',
      locationLayer: this._locationLayer,
      imgLayer: this._imgLayer
    })

    this.initWithMyConfig(labelWorkerConfig)
  }

  // #region 初始化

  /**
   * 进行LabelWorkerConfig 部分的初始化
   * @param config
   */
  initWithMyConfig(config: LabelWorkerConfig) {
    this.refreshStage()
    if (config.autofit) {
      const ele = this.config_stageConfig.container as HTMLElement
      addListener(ele, () => {
        this.refreshStage()
      })
    }
  }

  public getBufferLayer() {
    return this._bufferLayer
  }

  /**
   * 重新初始化舞台
   */
  refreshStage() {
    if (this._imgUrl) {
      // 如果有图片就用图片来适应初始化
      this.initImg(this._imgUrl)
    } else {
      // 其它情况归0
      const ele = this.config_stageConfig.container as HTMLElement
      const { width, height } = getComputedStyle(ele)
      this._reset()
      this.width(parseInt(width) || 0)
      this.height(parseInt(height) || 0)
      this.batchDraw()
      console.log('refreshStage no image', width, height)
    }
  }

  _reset() {
    this.position({ x: 0, y: 0 })
    this.rotation(0)
    this.scale({ x: 1, y: 1 })
  }

  /**
   * 初始化背景图
   * @param imgSrc: 图片
   */
  async initImg(imgSrc: string = '') {
    const debugid = Date.now()
    console.log('尝试加载', imgSrc, debugid)
    const _imgLayer = this._imgLayer
    this._imgUrl = imgSrc
    try {
      const imageObj = await getImageObj(imgSrc)
      const imageWater = await getImageObj(Water)

      // 先重置
      this.position({ x: 0, y: 0 })
      this.rotation(0)
      this.scale({ x: 1, y: 1 })

      // 根据当前展示图片的尺寸，让舞台自适应该图片的缩放比例
      const containerWidth = parseInt(
        getComputedStyle(this.container()).width ?? 0
      )
      const containerHeight = parseInt(
        getComputedStyle(this.container()).height ?? 0
      )
      this.width(containerWidth)
      this.height(containerHeight)

      if (this.config_labelworker.imageAutofit) {
        const ratio = calcFitRatio(
          containerWidth,
          containerHeight,
          imageObj.width,
          imageObj.height
        )
        this.scale({ x: ratio, y: ratio })
      }
      _imgLayer.removeChildren()
      _imgLayer.add(
        new Image({
          x: 0,
          y: 0,
          image: imageObj,
          width: imageObj.width,
          height: imageObj.height,
          name: 'bkg'
        })
      )
      _imgLayer.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          fillPatternImage: imageWater,
          fillPatternRepeat: 'repeat',
          width: imageObj.width,
          height: imageObj.height
        })
      )

      this.batchDraw()

      // 报告图片加载完成
      console.log('labelworker', '图片加载完毕')
    } catch (error) {
      console.log('initimg error', error, debugid)
      _imgLayer.removeChildren()
      this.batchDraw()
    }
  }

  /**
   * 清除图片
   */
  clearImg() {
    this._imgLayer.removeChildren()
    // this._reset()
    this.batchDraw()
  }

  // #endregion

  // async initWaterImg(){
  //   //  // 水印图片
  //   //  if (this.config_labelworker.waterUrl) {
  //   //   const waterObj = await getImageObj(this.config_labelworker.waterUrl)
  //   //   const waterImg = new Image({
  //   //     x: 0,
  //   //     y: 0,
  //   //     image: waterObj,
  //   //     width: imageObj.width,
  //   //     height: imageObj.height
  //   //   })
  //   //   if (waterImg) {
  //   //     _imgLayer.add(waterImg)
  //   //   }
  //   // }
  //   // _imgLayer.batchDraw()
  // }

  // #region location

  enableLocation(isEnable: boolean) {
    this._locationPainter.enable(isEnable)
  }

  setLocactionColor(color: string) {
    this._locationPainter.setColor(color)
  }

  // #endregion
  enableLayerListening(isEnable:boolean) {
    this.children.each(item => item.listening(isEnable))
    this.batchDraw()
  }
  // #region

  // #endregion

  // #region plugins

  /**
   * 安装某个插件
   * @param instance
   */
  installPlugin(instance: PluginInterface) {
    instance.install(this)
    this.plugins.push(instance)
  }

  /**
   * 指定卸载某个插件
   * @param instance
   */
  uninstallPlugin(instance: PluginInterface) {
    instance.uninstall(this)
  }

  /**
   * 注销当前组件
   */
  dispose() {
    // 注销插件
    const _this = this
    this.plugins.forEach(function(p) {
      try {
        _this.uninstallPlugin(p)
      } catch (error) {
        console.log(`plugin ${p.name} 卸载失败`, error)
      }
    })

    // 注销事件代理
    this.disableShortKeyProxy()
  }

  // #endregion

  // #region ShortKeyFactory

  /**
   * 登记并获取快捷键代理，若要使用，需要启动
   */
  public registerGetShortKeyProxy(units: ShortKeyFactoryKeyUnit[]) {
    console.log('units', units)
    this._shortKeyFactory.registerKeys(units)
    return this._shortKeyFactory.getBus()
  }

  /**
   * 启用快捷键事件代理
   */
  public enableShortKeyProxy() {
    this._shortKeyFactory.enable()
  }

  /**
   * 禁用快捷键事件代理
   */
  public disableShortKeyProxy() {
    this._shortKeyFactory.disable()
  }

  // #endregion

  // #region action manage

  /**
   * 内部方法
   *
   * 设置绘制状态以禁用图层可用性
   */
  protected _setIsDrawing(isDrawing: boolean) {
    console.log('_setIsDrawing', isDrawing)
    if (isDrawing) {
      this._markLayer.listening(false)
      this._bufferLayer.listening(true)
    } else {
      this._markLayer.listening(true)
      this._bufferLayer.listening(false)
    }
  }

  /**
   * 设置绘制状态以禁用图层可用性
   * @param isDrawing
   */
  public setIsDrawing(isDrawing: boolean):void{
    this._setIsDrawing(isDrawing)
  }

  /**
   * 当前的action
   */
  private _currentAction?: PromiseExecutor<any>;

  /**
   * 获取当前动作
   * @param action
   */
  public getCurrentAction(): PromiseExecutor<any> {
    return this._currentAction!
  }

  /**
   * 设置当前动作
   * @param action
   */
  public setCurrentAction(action: PromiseExecutor<any>): void {
    if (this._currentAction) {
      console.log(`动作变换 ${this._currentAction.name} =>  ${action.name}`)
      this._currentAction.dispose('action changed by user')
      this._currentAction = undefined
    }
    this._currentAction = action
    this._setIsDrawing(true)
    setTimeout(() => {
      this.batchDraw()
    })
  }

  /**
   * 取消当前动作
   * @param action
   */
  public disposeCurrentAction(): void {
    if (this._currentAction) {
      console.log(`动作取消 ${this._currentAction.name} `)
      this._currentAction.dispose('action disposed by user')
      this._currentAction = undefined
      this._setIsDrawing(false)
    }
    setTimeout(() => {
      this.batchDraw()
    })
  }

  // #endregion

  // #region shapemanage

  /**
   * 添加图形到标注层
   * @param args
   */
  addShape(...args:Shape[]):void{
    args.forEach(item => {
      this._markLayer.add(item)
    })
    this._markLayer.batchDraw()
  }

  /**
   * 清除所有元素
   */
  clearShapes() {
    this._markLayer.destroyChildren()
  }
  // #endregion
}

export interface PluginInterface {
  name: string;
  install: (worker: LabelWorker) => void;
  uninstall: (worker: LabelWorker) => void;
}

export { LabelWorker }

export * from './shapes'
export * as tools from './tools'
export * from './painters'
