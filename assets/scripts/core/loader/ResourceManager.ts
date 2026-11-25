import { Prefab, SpriteFrame, VideoClip, type Asset, type AudioClip, type Sprite } from "cc";
import { BundleLoader } from "./BundleLoader";
import type { ILoader } from "./ILoader";

export class ResourceManager implements ILoader {
    private static _inst: ResourceManager;
    public static get inst(): ResourceManager {
        if (!ResourceManager._inst)
            ResourceManager._inst = new ResourceManager();
        return ResourceManager._inst;
    }

    async initBundles(path:string) {
        await BundleLoader.inst.loadBundles(path);
    }

    async loadResource<T extends Asset>(path: string, type?: new () => T): Promise<T> {
        if (type instanceof VideoClip || type instanceof Prefab)
            return BundleLoader.inst.loadResource(path, type);
        return this.loader.loadResource<T>(path, type);
    }
    async loadSpriteFrame(path: string, sprite?: Sprite): Promise<SpriteFrame> {
        return this.loader.loadSpriteFrame(path, sprite);
    }
    async loadText(path: string): Promise<string> {
        return this.loader.loadText(path);
    }
    async loadJson(path: string): Promise<Record<string, any>> {
        return this.loader.loadJson(path);
    }
    async loadVideoClip(path: string): Promise<VideoClip> {
        return BundleLoader.inst.loadVideoClip(path);
    }
    async loadPrefab(path: string): Promise<Prefab> {
        return BundleLoader.inst.loadPrefab(path);
    }
    async loadAudio(path: string): Promise<AudioClip> {
        return this.loader.loadAudio(path);
    }

    private get loader(): ILoader {
        return BundleLoader.inst;
    }
}