import { Asset, assetManager, AssetManager, JsonAsset, Prefab, Sprite, SpriteFrame, TextAsset, VideoClip } from "cc";

export class ResourceBundle {
    private bundle: AssetManager.Bundle;
    private bundlePath: string;
    /**
     * 创建一个资源包
     * @param bundle 资源包
     */
    constructor(bundle: AssetManager.Bundle | string) {
        if (bundle instanceof AssetManager.Bundle) {
            this.bundle = bundle;
        } else {
            this.bundlePath = bundle;
        }
    }

    /**
     * 加载资源包
     * @returns AssetManager.Bundle
     */
    async loadBundle(): Promise<AssetManager.Bundle> {
        if (this.bundle) {
            return this.bundle;
        }
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(this.bundlePath, (err, bundle: AssetManager.Bundle) => {
                if (err) return reject(err);
                this.bundle = bundle;
                resolve(bundle);
            });
        });
    }

    /**
     * 通过当前资源包加载资源
     * @param path 资源路径
     * @param type 资源类型
     * @returns 
     */
    async loadResource<T extends Asset>(path: string, type?: new () => T): Promise<T> {
        await this.loadBundle();
        return new Promise((resolve, reject) => {
            this.bundle!.load(path, type, (err, asset: T) => {
                if (err) return reject(err);
                resolve(asset);
            });
        });
    }

    /** 从已加载的 Bundle 中同步获取资源（需确保 Bundle 已加载） */
    getResource<T extends Asset>(path: string, type?: new () => T): T | null {
        return this.bundle!.get(path, type);
    }

    /**
     * 加载精灵帧，可选地直接设置到 Sprite 组件上
     * @param path 资源路径
     * @param sprite 目标 Sprite 组件
     */
    async loadSpriteFrame(path: string, sprite?:Sprite): Promise<SpriteFrame> {
        let spriteFrame = await this.loadResource<SpriteFrame>(path);
        if(sprite) sprite.spriteFrame = spriteFrame;
        return spriteFrame;
    }

    /** 同步获取精灵帧（自动补全 /spriteFrame 后缀） */
    getSpriteFrame(path: string): SpriteFrame | null {
        if (!path.endsWith("/spriteFrame")) {
            path = path + "/spriteFrame";
        }
        return this.getResource<SpriteFrame>(path);
    }

    /** 加载文本资源并返回字符串 */
    async loadText(path: string): Promise<string> {
        return (await this.loadResource<TextAsset>(path, TextAsset)).text;
    }

    /** 加载 JSON 资源并返回解析后的对象 */
    async loadJson(path: string): Promise<Record<string, any>> {
        return (await this.loadResource<JsonAsset>(path, JsonAsset)).json;
    }

    /** 加载视频资源 */
    async loadVideoClip(path: string): Promise<VideoClip> {
        return (await this.loadResource<VideoClip>(path, VideoClip));
    }

    /** 异步加载预制体 */
    async loadPrefabAsync(path: string): Promise<Prefab> {
        return (await this.loadResource<Prefab>(path, Prefab));
    }
}