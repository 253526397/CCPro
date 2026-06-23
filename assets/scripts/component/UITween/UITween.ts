import { _decorator, ccenum, Component, easing, Node, tween, UIOpacity, Vec3 } from 'cc';
import { UITweenEffect } from './UITweenEffect';
import { UITweenGroup } from './UITweenGroup';
const { ccclass, property } = _decorator;

export interface OriginalProperty {
    opacity: number;
    scaleX: number;
    scaleY: number;
    x: number;
    y: number;
}

export interface TweenNodeProperty {
    x?: number;
    y?: number;
    scale?: Vec3;
}

export interface TweenOpacityProperty {
    opacity?: number;
}

export enum UITweenEasingType { 
    none = "none",
    linear = "linear",
    bounceOut = "bounceOut",
    elasticOut = "elasticOut",
    elasticIn = "elasticIn",
}
ccenum(UITweenEasingType);

@ccclass('UITween')
export class UITween extends Component {
    @property([UITweenGroup])
    group: UITweenGroup[] = [];
    @property([UITweenEffect])
    effects: UITweenEffect[] = [];
    @property({type:UITweenEasingType})
    easingType: UITweenEasingType = UITweenEasingType.none;
    @property({ type: Number, tooltip: 'UI打开的时候缓动延迟时间' })
    delay: number = 0;
    @property({ type: Number, tooltip: '每个缓动对象的缓动间隔时间' })
    gap: number = 0.05;
    @property({ type: Number, tooltip: '每个缓动对象的缓动持续时间' })
    duration: number = 0.3;
    @property(Boolean)
    autoPlay: boolean = true;

    private targetList: Node[] = [];
    private targetOriginalPropertyList: OriginalProperty[] = [];
    start() {
        this.initTargetList();
        if(this.autoPlay){
            this.play();
        }
    }

    /**初始化所有的target列表*/
    private initTargetList() {
        this.targetList = [];
        for (let i = 0; i < this.group.length; i++) {
            const element = this.group[i];
            this.targetList = this.targetList.concat(element.getGrounpNodeList());
        }
        for (let i = 0; i < this.targetList.length; i++) {
            const element = this.targetList[i];
            let alphaComponent = element.getComponent(UIOpacity);
            if (!alphaComponent)
                element.addComponent(UIOpacity);
            this.targetOriginalPropertyList.push({
                opacity: alphaComponent ? alphaComponent.opacity : 255,
                scaleX: element.scale.x,
                scaleY: element.scale.y,
                x: element.x,
                y: element.y,
            })
        }
    }

    play() {
        for (let index = 0; index < this.targetList.length; index++) {
            const element = this.targetList[index];
            const originalProperty = this.targetOriginalPropertyList[index];
            const delayTime = this.delay + index * this.gap;
            let nodePeroperty: TweenNodeProperty = {};
            let opacityProperty: TweenOpacityProperty = {};
            this.effects.forEach(effect => {
                effect.setStartValue(element);
                effect.setTweenValue(originalProperty, nodePeroperty, opacityProperty);
            });
            let ease = easing[this.easingType];
            tween(element)
                .delay(delayTime)
                .to(this.duration, nodePeroperty, {easing: ease})
                .start();
            const opacityComponent = element.getComponent(UIOpacity);
            if (opacityComponent) {
                tween(opacityComponent)
                    .delay(delayTime)
                    .to(this.duration, opacityProperty, {easing: ease})
                    .start();
            }
        }
    }

    protected onDisable(): void {
        for (let index = 0; index < this.targetList.length; index++) {
            const element = this.targetList[index];
            const property = this.targetOriginalPropertyList[index];
            element.position.set(property.x, property.y, 0);
            element.setScale(property.scaleX, property.scaleY, 1);
            let alphaComponent = element.getComponent(UIOpacity);
            if (alphaComponent) {
                alphaComponent.opacity = property.opacity;
            }
        }
    }
}


