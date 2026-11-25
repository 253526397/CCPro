import type { Asset, AudioClip, Prefab, Sprite, SpriteFrame, VideoClip } from "cc";

export interface ILoader {
    /**
     * 通过当前资源包加载资源
     * @param path 资源路径
     * @param type 资源类型
     * @returns 
     */
    loadResource<T extends Asset>(path: string, type?: new () => T): Promise<T>;
    /**
     * 加载精灵帧，可选地直接设置到 Sprite 组件上
     * @param path 资源路径
     * @param sprite 目标 Sprite 组件
     */
    loadSpriteFrame(path: string, sprite?: Sprite): Promise<SpriteFrame>;
    /**
     * 加载文本文件
     * @param path 文件路径
     */
    loadText(path: string): Promise<string>;
    /**
     * 加json文件
     * @param path 文件路径
     */
    loadJson(path: string): Promise<Record<string, any>>;
    /**
     * 加载视频片段
     * @param path 文件路径
     */
    loadVideoClip(path: string): Promise<VideoClip>;
    /**
     * 加载Prefab
     * @param path 文件路径
     */
    loadPrefab(path: string): Promise<Prefab>
    /**
     * 加载音频
     * @param path 文件路径
     */
    loadAudio(path: string): Promise<AudioClip>
}