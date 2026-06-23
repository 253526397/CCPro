import { _decorator, ccenum, Node, UITransform, Vec2 } from "cc";
import type { IControler } from "../UIControlerGroup";

const { ccclass, property } = _decorator;

export enum TransformControlerAtb {
    none,
    size,
    anchor,
}
ccenum(TransformControlerAtb)

@ccclass('TransformControler')
export class TransformControler implements IControler {
    @property({ type: TransformControlerAtb })
    atb: TransformControlerAtb = TransformControlerAtb.none;

    @property({ 
        type: Vec2 , 
        visible: function (this: TransformControler) { return this.atb == TransformControlerAtb.size; }
    })
    size: Vec2 = new Vec2(100, 100);

    @property({ 
        type: Vec2 , 
        visible: function (this: TransformControler) { return this.atb == TransformControlerAtb.anchor; }
    })
    anchor: Vec2 = new Vec2(0.5, 0.5);

    updateStatus(target: Node): void {
        if(this.atb == TransformControlerAtb.none)
            return;
        let transform = target.getComponent(UITransform);
        if(!transform)
            transform = target.addComponent(UITransform);
        switch(this.atb){
            case TransformControlerAtb.size:
                transform.setContentSize(this.size.x,this.size.y);
                break;
            case TransformControlerAtb.anchor:
                transform.setAnchorPoint(this.anchor.x,this.anchor.y);
                break;
        }
    }
}