import { _decorator, ccenum, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum UITweenTargetType{
    TARGET_LIST,
    TARGET_CHILDREN
}

ccenum(UITweenTargetType)

@ccclass('UITweenGroup')
export class UITweenGroup{
    @property({type:UITweenTargetType})
    targetType:UITweenTargetType = UITweenTargetType.TARGET_LIST;

    @property({type:[Node], visible:function(this:UITweenGroup){return this.targetType == UITweenTargetType.TARGET_LIST;}})
    targetList:Node[] = [];

    @property({type:Node, visible:function(this:UITweenGroup){return this.targetType == UITweenTargetType.TARGET_CHILDREN;}})
    parentNode:Node = null;

    getGrounpNodeList():Node[]{
        if(this.targetType == UITweenTargetType.TARGET_LIST){
            return this.targetList;
        }else{
            return this.parentNode.children;
        }
    }
}


