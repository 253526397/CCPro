import { _decorator, Node } from 'cc';
import { NodeControler } from './componetControler/NodeControler';
import { TransformControler } from './componetControler/TransformControler';
const { ccclass, property } = _decorator;

@ccclass('UIControlerGroup')
export class UIControlerGroup implements IControler {
    @property({ group: { name: "node" }, type: NodeControler })
    nodeControler: NodeControler = null;
    @property({ group: { name: "tran" }, type: TransformControler })
    transformControler: TransformControler = null;

    private controlers: IControler[] = [];

    updateStatus(target: Node): void {
        this.initGroup();
        this.controlers.forEach(controler => controler.updateStatus(target));
    }

    initGroup() {
        this.controlers = [];
        this.nodeControler && this.controlers.push(this.nodeControler);
        this.transformControler && this.controlers.push(this.transformControler);
    }
}

export interface IControler {
    updateStatus(target: Node): void;
}