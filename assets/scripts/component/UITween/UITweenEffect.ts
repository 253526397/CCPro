import { _decorator, ccenum, Component, Node, Tween, UIOpacity, Vec3 } from 'cc';
import type { OriginalProperty, TweenNodeProperty, TweenOpacityProperty } from './UITween';
const { ccclass, property } = _decorator;
enum UITweenEffectType {
    SCALE,
    OPACITY,
    MOVE_TO_RIGHT,
    MOVE_TO_LEFT,
    MOVE_TO_TOP,
    MOVE_TO_BOTTOM,
}
ccenum(UITweenEffectType);

@ccclass('UITweenEffect')
export class UITweenEffect {
    @property({ type: UITweenEffectType })
    effectType: UITweenEffectType = UITweenEffectType.SCALE;
    @property({ type: Number, visible: function (this: UITweenEffect) { return this.effectType == UITweenEffectType.SCALE; } })
    scaleStartValue: number = 0;
    @property({ type: Number, visible: function (this: UITweenEffect) { return this.effectType == UITweenEffectType.OPACITY; } })
    alphaStarValue: number = 0;
    @property({
        type: Number,
        visible: function (this: UITweenEffect) { return this.effectType != UITweenEffectType.OPACITY && this.effectType != UITweenEffectType.SCALE; }
    })
    moveValue: number = 0;
    // @property(Boolean)
    // isMix:boolean = true;
    // @property({type:Number, visible: function (this: UITweenEffect) { return !this.isMix; }})
    // duration: number = 0.3;


    public setStartValue(element: Node) {
        switch (this.effectType) {
            case UITweenEffectType.SCALE:
                element.setScale(this.scaleStartValue, this.scaleStartValue, 1);
                break;
            case UITweenEffectType.OPACITY:
                let alphaComponent = element.getComponent(UIOpacity);
                alphaComponent.opacity = this.alphaStarValue;
                break;
            case UITweenEffectType.MOVE_TO_RIGHT:
                element.position.set(element.position.x - this.moveValue, element.position.y, 0);
                break;
            case UITweenEffectType.MOVE_TO_LEFT:
                element.position.set(element.position.x + this.moveValue, element.position.y, 0);
                break;
            case UITweenEffectType.MOVE_TO_TOP:
                element.position.set(element.position.x, element.position.y - this.moveValue, 0);
                break;
            case UITweenEffectType.MOVE_TO_BOTTOM:
                element.position.set(element.position.x, element.position.y + this.moveValue, 0);
                break;
        }
    }

    public setTweenValue(property: OriginalProperty, nodePro: TweenNodeProperty, opacityPro: TweenOpacityProperty) {
        switch (this.effectType) {
            case UITweenEffectType.SCALE:
                nodePro.scale = new Vec3(property.scaleX, property.scaleY, 1);
                break;
            case UITweenEffectType.OPACITY:
                opacityPro.opacity = property.opacity;
                break;
            case UITweenEffectType.MOVE_TO_RIGHT:
            case UITweenEffectType.MOVE_TO_LEFT:
                nodePro.x = property.x;
                break;
            case UITweenEffectType.MOVE_TO_TOP:
            case UITweenEffectType.MOVE_TO_BOTTOM:
                nodePro.y = property.y;
                break;
        }
    }

    public setTweenToProperty(property: OriginalProperty, nodeTween:Tween<Node>, opacityTween:Tween<UIOpacity>, duration:number):any{ 
         let nodePro:TweenNodeProperty = {};
        let opacityPro:TweenOpacityProperty = {};
        switch (this.effectType) {
            case UITweenEffectType.SCALE:
                nodePro.scale = new Vec3(property.scaleX, property.scaleY, 1);
                nodeTween.to(duration, nodePro);
                break;
            case UITweenEffectType.OPACITY:
                opacityPro.opacity = property.opacity;
                opacityTween.to(duration, opacityPro);
                break;
            case UITweenEffectType.MOVE_TO_RIGHT:
            case UITweenEffectType.MOVE_TO_LEFT:
                nodePro.x = property.x;
                 nodeTween.to(duration, nodePro);
                break;
            case UITweenEffectType.MOVE_TO_TOP:
            case UITweenEffectType.MOVE_TO_BOTTOM:
                nodePro.y = property.y;
                 nodeTween.to(duration, nodePro);
                break;
        }
    }

    public getTweenValue(property: OriginalProperty):any{
        let nodePro:TweenNodeProperty = {};
        let opacityPro:TweenOpacityProperty = {};
        switch (this.effectType) {
            case UITweenEffectType.SCALE:
                nodePro.scale = new Vec3(property.scaleX, property.scaleY, 1);
                break;
            case UITweenEffectType.OPACITY:
                opacityPro.opacity = property.opacity;
                break;
            case UITweenEffectType.MOVE_TO_RIGHT:
            case UITweenEffectType.MOVE_TO_LEFT:
                nodePro.x = property.x;
                break;
            case UITweenEffectType.MOVE_TO_TOP:
            case UITweenEffectType.MOVE_TO_BOTTOM:
                nodePro.y = property.y;
                break;
        }
    }
}