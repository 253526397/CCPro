import { _decorator, Color, Component, Material, Sprite } from 'cc';
const { ccclass, property } = _decorator;

/** Requires a CustomMaterial made from HitFlashWhite.effect. */
@ccclass('HitFlashWhite')
export class HitFlashWhite extends Component {
    @property({ type: Sprite }) sprite: Sprite | null = null;
    @property({ min: 0.01, tooltip: '闪白从最亮衰减至正常的时长（秒）。' }) duration = 0.12;
    @property({ range: [0, 1], slide: true }) intensity = 1;
    @property({ type: Color, tooltip: '闪烁目标颜色（受击闪光色）。' }) flashColor = new Color(255, 255, 255, 255);

    private material: Material | null = null;
    private elapsed = 0;
    private playing = false;

    onLoad(): void {
        this.sprite ??= this.getComponent(Sprite);
        if (!this.sprite) {
            console.error('[HitFlashWhite] 当前节点缺少 Sprite 组件。');
            return;
        }
        this.material = this.sprite.getMaterialInstance(0);
        this.material.setProperty('flashAmount', 0);
        this.material.setProperty('flashColor', this.flashColor);
    }

    /** 每次受击时调用；重复调用会从最亮状态重新开始。 */
    public play(): void {
        if (!this.material) return;
        this.elapsed = 0;
        this.playing = true;
        this.material.setProperty('flashAmount', this.intensity);
    }

    public stop(): void {
        this.playing = false;
        this.material?.setProperty('flashAmount', 0);
    }

    update(dt: number): void {
        if (!this.playing || !this.material) return;
        this.elapsed += dt;
        const t = Math.min(this.elapsed / Math.max(this.duration, 0.01), 1);
        // Fast white flash, then a smooth fade back to the original image.
        this.material.setProperty('flashAmount', this.intensity * (1 - t) * (1 - t));
        if (t >= 1) this.stop();
    }

    onDisable(): void { this.stop(); }
}
