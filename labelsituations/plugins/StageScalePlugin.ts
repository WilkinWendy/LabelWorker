import { PluginInterface, LabelWorker, tools } from 'labelworker'
import { KonvaEventObject } from 'konva/types/Node'

export interface StageScalePluginConfig {}

export class StageScalePlugin implements PluginInterface {
  name = 'StageScalePlugin';

  private _mouseWheelEvent!: (e: KonvaEventObject<WheelEvent>) => void;

  install(instance: LabelWorker) {
    const _stage = instance
    const _this = this
    const scaleBy = 0.9

    _stage.off('wheel', this._mouseWheelEvent)
    _stage.on(
      'wheel',
      (this._mouseWheelEvent = function(e) {
        e.evt.preventDefault()

        // const mousePointTo = {
        //   x: _stage.getPointerPosition().x / oldScale - _stage.x() / oldScale,
        //   y: _stage.getPointerPosition().y / oldScale - _stage.y() / oldScale
        // };

        // const newPos = {
        //   x:
        //     -(mousePointTo.x - _stage.getPointerPosition().x / newScale) *
        //     newScale,
        //   y:
        //     -(mousePointTo.y - _stage.getPointerPosition().y / newScale) *
        //     newScale
        // };

        const oldScale = _stage.scaleX()
        const realScaleBy = e.evt.deltaY > 0 ? scaleBy : 1 / scaleBy
        const newScale = oldScale * realScaleBy
        const { x, y } = _stage.getPointerPosition()

        const newpos = {
          x: _stage.x() + (x - _stage.x()) * (1 - realScaleBy),
          y: _stage.y() + (y - _stage.y()) * (1 - realScaleBy)
        }

        _stage.scale({ x: newScale, y: newScale })
        _stage.position(newpos)
        _stage.batchDraw()
      })
    )
  }

  /**
   * 卸载
   * @param instance
   */
  uninstall(instance: LabelWorker) {
    const _stage = instance
    _stage.off('wheel', this._mouseWheelEvent)
  }
}
