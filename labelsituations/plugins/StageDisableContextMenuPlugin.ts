import { PluginInterface, LabelWorker, tools } from 'labelworker'
import { KonvaEventObject } from 'konva/types/Node'

export interface StageDisableContextMenuPluginConfig {}

export class StageDisableContextMenuPlugin implements PluginInterface {
  name='StageDisableContextMenuPlugin'

  private contextmenuFunc!:(e:KonvaEventObject<MouseEvent>)=>void
  install(instance: LabelWorker) {
    instance.on('contextmenu', this.contextmenuFunc = (e:KonvaEventObject<MouseEvent>) => {
      e.evt.preventDefault()
      e.evt.returnValue = false
      return false
    })
  }

  /**
   * 卸载
   * @param instance
   */
  uninstall(instance: LabelWorker) {
    instance.off('contextmenu', this.contextmenuFunc)
  }
}
