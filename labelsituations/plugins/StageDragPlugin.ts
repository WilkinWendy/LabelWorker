import { PluginInterface, LabelWorker, tools } from 'labelworker'
import { Layer } from 'konva/types/Layer'

export interface StageDragPluginConfig {
  // 用来禁用marklayer
  markLayer:Layer
}

export class StageDragPlugin implements PluginInterface {
  name='StageDragPlugin'

  _markLayer!:Layer

  constructor(config:StageDragPluginConfig) {
    this._markLayer = config.markLayer
  }

  private keydownFunc!:(e:KeyboardEvent)=>void
  private keyupFunc!:(e:KeyboardEvent)=>void
  private mousemoveFunc!:(e:MouseEvent)=>void

  install(instance: LabelWorker) {
    const container = instance.container()
    // container.tabIndex = 1;

    const setGrab = () => {
      container.style.cursor = 'grab'
    }
    const setGrabin = () => {
      container.style.cursor = 'grabbing'
    }
    const setNormal = () => {
      container.style.cursor = ''
    }

    let isEntering = false
    const reset = () => {
      console.log('marklayer重新启用了')
      instance.setIsDrawing(false)
      instance.batchDraw()
      instance.draggable(false)
      setNormal()
      container.removeEventListener('mouseover', setGrab)
      container.removeEventListener('mouseout', setNormal)
    }

    const keydownFunc = this.keydownFunc = (e:KeyboardEvent) => {
      if (isEntering) {
        return
      }

      // alt + 鼠标左键
      if (tools.eventJudge.isAltKey(e)) {
        isEntering = true
        console.log('StageDragPlugin marklayer禁用了', e)
        e.preventDefault()
        instance.setIsDrawing(true)
        instance.batchDraw()
        instance.draggable(true)
        setGrab()
        container.addEventListener('mouseover', setGrab)
        container.addEventListener('mouseout', setNormal)
      }
    }

    const keyupFunc = this.keyupFunc = (e:KeyboardEvent) => {
      if (!isEntering) {
        return
      }
      // alt + 鼠标左键
      if (tools.eventJudge.isAltKey(e)) {
        console.log('StageDragPlugin keyup终结 当前entering', isEntering)
        e.preventDefault()
        isEntering = false
        reset()
      }
    }

    const mousemoveFunc = this.mousemoveFunc = (e) => {
      // 如果本来就已退出该模式，则直接结束
      if (!isEntering) {
        return
      }
      if (!e.altKey) {
        console.log('StageDragPlugin mousemove终结 当前entering', isEntering)
        e.preventDefault()
        isEntering = false
        reset()
      }
    }

    window.addEventListener('keydown', keydownFunc)
    window.addEventListener('keyup', keyupFunc)
    window.addEventListener('mousemove', mousemoveFunc) // 增加终止条件，利于恢复状态
  }

  /**
   * 卸载
   * @param instance
   */
  uninstall(instance: LabelWorker) {
    window.removeEventListener('keydown', this.keydownFunc)
    window.removeEventListener('keyup', this.keyupFunc)
    window.removeEventListener('mousemove', this.mousemoveFunc)
  }
}
