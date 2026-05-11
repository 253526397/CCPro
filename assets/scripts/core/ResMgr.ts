import { resources, Asset, AssetManager } from 'cc';

/** 热更检查结果的描述 */
export interface HotfixResult {
  hasUpdate: boolean;
  version: string;
  files: string[];
  totalSize: number;
}

/**
 * 全局资源管理器，封装本地/远程资源加载与热更版本管理。
 * 业务模块不区分本地/远程，传入路径由 ResMgr 内部决定从哪个 Bundle 加载。
 * 远程 Bundle 优先级高于本地 Bundle，实现热更资源覆盖。
 */
export class ResMgr {
  private static _inst: ResMgr;
  static get inst(): ResMgr {
    if (!this._inst) this._inst = new ResMgr();
    return this._inst;
  }

  private remoteBundle: AssetManager.Bundle | null = null;
  private currentVersion: string = '0.0.0';

  /** 从本地 resources 加载资源 */
  async loadLocal<T extends Asset>(path: string, type: new () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      resources.load(path, type, (err, asset) => {
        if (err) {
          reject(err);
        } else {
          resolve(asset as T);
        }
      });
    });
  }

  /** 从远程热更 Bundle 加载资源，需先执行 applyHotfix */
  async loadRemote<T extends Asset>(path: string, type: new () => T): Promise<T> {
    if (!this.remoteBundle) {
      throw new Error('Remote bundle not loaded');
    }
    return new Promise((resolve, reject) => {
      this.remoteBundle!.load(path, type, (err, asset) => {
        if (err) {
          reject(err);
        } else {
          resolve(asset as T);
        }
      });
    });
  }

  /** 优先从远程加载，失败时自动回退本地 */
  async loadWithFallback<T extends Asset>(path: string, type: new () => T): Promise<T> {
    if (this.remoteBundle) {
      try {
        return await this.loadRemote<T>(path, type);
      } catch (e) {
        console.warn(`[ResMgr] Remote loading failed for ${path}, falling back to local`);
      }
    }
    return this.loadLocal<T>(path, type);
  }

  /** 向服务端查询是否有新版本 */
  async checkHotfix(versionUrl: string): Promise<HotfixResult> {
    try {
      const response = await fetch(versionUrl);
      const remote = await response.json();

      if (remote.version !== this.currentVersion) {
        return {
          hasUpdate: true,
          version: remote.version,
          files: remote.files || [],
          totalSize: remote.totalSize || 0,
        };
      }
    } catch (e) {
      console.warn('[ResMgr] Failed to check hotfix version:', e);
    }

    return { hasUpdate: false, version: this.currentVersion, files: [], totalSize: 0 };
  }

  /** 下载并应用远程热更 Bundle，替换后续 loadRemote 的源 */
  async applyHotfix(result: HotfixResult, bundleUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      AssetManager.ResourceManager.instance.loadBundle(bundleUrl, {
        version: result.version,
      }, (err, bundle) => {
        if (err) {
          reject(err);
        } else {
          this.remoteBundle = bundle;
          this.currentVersion = result.version;
          resolve();
        }
      });
    });
  }
}
