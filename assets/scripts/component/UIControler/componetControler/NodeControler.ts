import { _decorator, ccenum, Node, Vec3 } from "cc";
import type { IControler } from "../UIControlerGroup";

const { ccclass, property } = _decorator;

export enum NodeControlerAtb {
    none,
    active,
    position,
    rotation,
    scale,
}
ccenum(NodeControlerAtb);


@ccclass('NodeControler')
export class NodeControler implements IControler{
    @property({
        type: NodeControlerAtb,
        tooltip: "选择要控制的属性"
    })
    atb: NodeControlerAtb = NodeControlerAtb.none;

    @property({
        type: Boolean,
        visible: function (this: NodeControler) { return this.atb == NodeControlerAtb.active; }
    })
    active:boolean = true;

    @property({
        type: Vec3, 
        visible: function (this: NodeControler) { return this.atb == NodeControlerAtb.position; }
    })
    position: Vec3 = new Vec3(0,0,0);

    @property({
        type: Number, 
        visible: function (this: NodeControler) { return this.atb == NodeControlerAtb.rotation; }
    })
    rotation:number = 0;

    @property({
        type: Vec3, 
        visible: function (this: NodeControler) { return this.atb == NodeControlerAtb.scale; }
    })
    scale:Vec3 = new Vec3(1,1,1);

    updateStatus(target: Node): void {
        if(this.atb == NodeControlerAtb.none)
            return;
        switch(this.atb){
            case NodeControlerAtb.active:
                target.active = this.active;
                break;
            case NodeControlerAtb.position:
                target.setPosition(this.position);
                break;
            case NodeControlerAtb.rotation:
                let quat = target.getRotation();
                quat.set(quat.x, quat.y, this.rotation, quat.w);
                break;
            case NodeControlerAtb.scale:
                target.scale.set(this.scale.x, this.scale.y, this.scale.z);
                break;
        }
    } 
}