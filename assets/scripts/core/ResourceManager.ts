import { AssetManager, assetManager, resources, TextAsset, type Asset } from "cc";
import { ResourceBundle } from "./ResourceBundle";

/** 全局资源管理器，负责本地 Bundle 加载和远程资源下载 */
export class ResourceManager {
    private static _inst: ResourceManager;
    /** 默认的本地资源包（resources 目录） */
    public resourceBundle: ResourceBundle;
    /** 单例 */
    public static get inst(): ResourceManager {
        if (!this._inst) this._inst = new ResourceManager();
        return this._inst;
    }

    constructor() {
        this.resourceBundle = new ResourceBundle(resources);
    }

    /**
     * 从远程 URL 加载任意资源
     * @param url 远程资源地址
     * @param options 加载选项（可指定文件扩展名等）
     */
    public static async loadRemote<T extends Asset>(url: string, options?: {
        [k: string]: any;
        ext?: string;
    } | null
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote<T>(url, options ?? {}, (err, data: T) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }

    /** 从远程 URL 加载文本内容 */
    public static async loadRemoteText(url: string): Promise<string> {
        return (await this.loadRemote<TextAsset>(url))["_file"] as string;
    }
}