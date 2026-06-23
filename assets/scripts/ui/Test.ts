import { _decorator, Component } from 'cc';
import { UIControler } from '../component/UIControler/UIControler';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {
    private uiControler: UIControler = null;
    start() {
        this.uiControler = this.node.getComponent(UIControler);
    }

    update(deltaTime: number) {
        
    }
}


