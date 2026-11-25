import { _decorator, Component, Node } from 'cc';
import { HitFlashWhite } from '../../ui/common/effect/HitFlashWhite';
const { ccclass, property } = _decorator;

@ccclass('EffectTest')
export class EffectTest extends Component {
    @property(Node)
    effectNode: Node;
    private onButtonClick() {
        let hitFlash = this.effectNode.getComponent(HitFlashWhite);
        if (hitFlash)
            hitFlash.play();
    }
}


