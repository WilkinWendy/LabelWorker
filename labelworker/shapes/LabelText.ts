import Konva from 'konva'
import { Stage } from 'konva/types/Stage'
type Text = Konva.Text;
const Text = Konva.Text

/**
 * 固定可见宽度的text
 */
export class LabelText extends Text {
  getFontSize() {
    const stage = this.getStage() as Stage
    if (!stage) {
      // console.log('LabelText getFontSize stage', stage)
    }
    const final = stage ? this.attrs['fontSize'] / stage.scaleX() : this.attrs['fontSize']
    return final
  }
}
LabelText.prototype.className = 'LabelText'
