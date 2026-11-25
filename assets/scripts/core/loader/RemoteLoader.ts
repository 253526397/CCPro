import { assetManager, AudioClip, ImageAsset, JsonAsset, Prefab, SpriteFrame, TextAsset, Texture2D, type Asset, type Sprite, type VideoClip } from "cc";
import type { ILoader } from "./ILoader";

export class RemoteLoader implements ILoader {
    private static _inst: RemoteLoader;
    public static get inst(): RemoteLoader {
        if (!RemoteLoader._inst)
            RemoteLoader._inst = new RemoteLoader();
        return RemoteLoader._inst;
    }

    async loadResource<T extends Asset>(path: string, type?: new () => T): Promise<T> {
        return new Promise<T>(async (resolve, reject) => {
            assetManager.loadRemote(path, null, (err, asset: T) => {
                if (err) return reject(err);
                resolve(asset);
            });
        });
    }
    async loadSpriteFrame(path: string, sprite?: Sprite): Promise<SpriteFrame> {
        let imgAsset = await this.loadResource(path, ImageAsset);
        let texture: Texture2D = new Texture2D();
        texture.image = imgAsset;
        let spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        if(sprite)
            sprite.spriteFrame = spriteFrame;
        return spriteFrame;
    }
    async loadText(path: string): Promise<string> {
        let textAsset = await this.loadResource(path, TextAsset);
        return textAsset.text ?? textAsset["_file"] ?? "";
    }
    async loadJson(path: string): Promise<Record<string, any>> {
        let jsonAsset = await this.loadResource(path, JsonAsset);
        return jsonAsset.json;
    }
    async loadVideoClip(path: string): Promise<VideoClip> {
        throw new Error("Method not implemented.");
    }
    async loadPrefab(path: string): Promise<Prefab> {
        throw new Error("Method not implemented.");
    }
    async loadAudio(path: string): Promise<AudioClip> {
        return await this.loadResource(path, AudioClip);
    }
}