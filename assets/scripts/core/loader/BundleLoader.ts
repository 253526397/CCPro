import { AssetManager, assetManager, AudioClip, JsonAsset, Prefab, resources, SpriteFrame, TextAsset, VideoClip, type Asset, type Sprite } from "cc";
import { DEV } from "cc/env";
import type { ILoader } from "./ILoader";

export class BundleLoader implements ILoader {
    private static _inst: BundleLoader;
    private bundleMap: Record<string, AssetManager.Bundle | null> = {};
    private bundleVersionMap: Record<string, string> = {};

    public static get inst(): BundleLoader {
        if (!BundleLoader._inst)
            BundleLoader._inst = new BundleLoader();
        return BundleLoader._inst;
    }

    constructor() {
        this.bundleMap["resources"] = null;
        this.bundleMap["remoteRes"] = null;
    }
    //#region ILoader实现
    loadResource<T extends Asset>(path: string, type: new () => T, endPath?: string): Promise<T> {
        let bundle = this.getBundle(path);
        let bundleResPath = this.getBundleResPath(path);
        if (endPath)
            bundleResPath = bundleResPath + endPath;
        if (!bundle || !bundle.getInfoWithPath(bundleResPath))
            return Promise.reject(new Error(`${path} asset not exist`));
        return new Promise<T>((resolve, reject) => {
            bundle.load(bundleResPath, type, (err, asset) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(asset);
                }
            });
        });
    }
    async loadSpriteFrame(path: string, sprite?: Sprite): Promise<SpriteFrame> {
        let spriteFrame = await this.loadResource(path, SpriteFrame, "/spriteFrame");
        if (sprite)
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
        return await this.loadResource(path, VideoClip);
    }
    async loadPrefab(path: string): Promise<Prefab> {
        return await this.loadResource(path, Prefab);
    }

    async loadAudio(path: string): Promise<AudioClip> {
        return await this.loadResource(path, AudioClip);
    }
    //#endregion

    private spliteResPath(resPath: string): [string, string] {
        let bundleName = resPath.split("/")[0];
        let resName = resPath.split("/").slice(1).join("/");
        return [bundleName, resName];
    }

    private getBundle(resPath: string): AssetManager.Bundle {
        let [bundleName, resName] = this.spliteResPath(resPath);
        return this.bundleMap[bundleName];
    }

    private getBundleResPath(resPath: string): string {
        let [bundleName, resName] = this.spliteResPath(resPath);
        let lastDotIndex = resName.lastIndexOf(".");
        return resName.substring(0, lastDotIndex);
    }

    /**
     * 加载所有的bundle
     * @param remotePath 远程cdn地址
     */
    async loadBundles(remotePath: string) {
        this.bundleMap["resources"] = resources;
        if (remotePath && !DEV)
            await this.loadBundleVersion(remotePath);
        for (const key in this.bundleMap) {
            this.bundleMap[key] = await this.loadBundle(key, this.bundleVersionMap[key]);
        }
    }

    /**
     * 加载单个bundle
     * @param key bundle名称
     * @param version bundle版本号
     * @returns 
     */
    private async loadBundle(key: string, version: string): Promise<AssetManager.Bundle> {
        return new Promise<AssetManager.Bundle>((resolve, reject) => {
            let options = version ? { version: version } : null;
            assetManager.loadBundle(key, options, (err, bundle: AssetManager.Bundle) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                }
                resolve(bundle);
            })
        });
    }

    /**
     * 加载所有bundle的版本控制文件
     * @param remotePath 远程cdn地址
     * @returns 
     */
    private async loadBundleVersion(remotePath: string): Promise<JsonAsset> {
        return new Promise<JsonAsset>((resolve, reject) => {
            assetManager.loadRemote<JsonAsset>(remotePath + "version.json", (err: Error | null, data: JsonAsset) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                this.bundleVersionMap = data.json;
                resolve(data);
            });
        })
    }
}