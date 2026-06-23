import { _decorator, CCInteger, Component, Node } from 'cc';
import { UIControlerGroup } from './UIControlerGroup';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('UIControler')
@executeInEditMode(true)
export class UIControler extends Component {
    @property(Boolean)
    runInEdit:boolean = false;
    @property({type:CCInteger, visible:false})
    private _statuIndex: number = 0;
    public get statuIndex(): number {
        return this._statuIndex;
    }
    @property(CCInteger)
    public set statuIndex(value: number) {
        this._statuIndex = value;
        this.updateStatus();
    }
    @property(Node)
    target:Node  = null;
    @property({type:[UIControlerGroup]})
    groups:UIControlerGroup[]  = [];

    protected onLoad(): void {
    }

    updateStatus(){
        if(!this.runInEdit)
            return;
        let group = this.groups[this.statuIndex];
        if(!group)
            return;
        group.updateStatus(this.target);
    }

    start() {
    }

    update(deltaTime: number) {
    }
}


