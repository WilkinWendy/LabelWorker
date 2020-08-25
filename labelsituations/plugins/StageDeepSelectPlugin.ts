import { PluginInterface, LabelWorker, tools } from 'labelworker'
import { KonvaEventObject } from 'konva/types/Node'
import { Layer } from 'konva/types/Layer'
import Konva from 'konva'

export interface StageDeepSelectPluginConfig {
  selectProperNode(): Konva.Node;
}

export class StageDeepSelectPlugin implements PluginInterface {
  name = 'StageDeepSelectPlugin';

  _selectProperNode: () => Konva.Node;
  constructor(config: StageDeepSelectPluginConfig) {
    this._selectProperNode = config.selectProperNode
  }

  private keydownFunc!: (e: KeyboardEvent) => void;
  private keyupFunc!: (e: KeyboardEvent) => void;

  private mouseClickEvent!: (e: MouseEvent) => void;

  install(instance: LabelWorker) {
    const _this = this
    const container = instance.container()
    // container.tabIndex = 1;

    let isEntering = false

    const keydownFunc = (this.keydownFunc = (e: KeyboardEvent) => {
      if (isEntering) {
        return
      }
      if (tools.eventJudge.isStrictCtrlKey(e)) {
        isEntering = true
        console.log('StageDeepSelectPlugin keydown')
        e.preventDefault() // 阻止默认行为
        instance.setIsDrawing(true) // 禁用marklayer监听
        instance.batchDraw()
        instance.container().addEventListener(
          'click',
          (this.mouseClickEvent = e => {
            const selectedNode = this._selectProperNode()
            console.log('选中元素为', selectedNode)

            selectedNode?.fire('click', {
              evt: e
            })
            setTimeout(() => {
              instance.batchDraw()
            })
          })
        )
      }
    })

    const keyupFunc = (this.keyupFunc = (e: KeyboardEvent) => {
      // ctrl
      if (tools.eventJudge.isStrictCtrlKey(e)) {
        isEntering = false
        console.log('StageDeepSelectPlugin keyup')
        e.preventDefault() // 阻止默认行为
        instance.setIsDrawing(false) //

        instance.container().removeEventListener('click', this.mouseClickEvent)
        instance.batchDraw()
      }
    })

    window.addEventListener('keydown', keydownFunc)
    window.addEventListener('keyup', keyupFunc)
  }

  /**
   * 卸载
   * @param instance
   */
  uninstall(instance: LabelWorker) {
    window.removeEventListener('keydown', this.keydownFunc)
    window.removeEventListener('keyup', this.keyupFunc)
  }
}
