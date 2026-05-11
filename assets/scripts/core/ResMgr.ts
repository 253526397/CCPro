import { resources, Asset, AssetManager } from 'cc';

export interface HotfixResult {
  hasUpdate: boolean;
  version: string;
  files: string[];
  totalSize: number;
}

export class ResMgr {
  private static _inst: ResMgr;
  static get inst(): ResMgr {
    if (!this._inst) this._inst = new ResMgr();
    return this._inst;
  }

  private remoteBundle: AssetManager.Bundle | null = null;
  private currentVersion: string = '0.0.0';

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
