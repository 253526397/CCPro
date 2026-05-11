import { ResMgr } from './ResMgr';
import { IPlatform } from '../platform/IPlatform';
import { EventBus } from './EventBus';
import { ErrorEvents } from '../events';

export class HotfixManager {
  private static _inst: HotfixManager;
  static get inst(): HotfixManager {
    if (!this._inst) this._inst = new HotfixManager();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private versionUrl: string = '';
  private bundleUrl: string = '';
  private currentVersion: string = '0.0.0';

  configure(versionUrl: string, bundleUrl: string): void {
    this.versionUrl = versionUrl;
    this.bundleUrl = bundleUrl;
  }

  getVersion(): string {
    return this.currentVersion;
  }

  async checkAndUpdate(platform: IPlatform): Promise<boolean> {
    const resMgr = ResMgr.inst;
    const result = await resMgr.checkHotfix(this.versionUrl);

    if (!result.hasUpdate) return false;

    if (!platform.getStorageAPI().get('hotfix_approved')) {
      return false;
    }

    try {
      await resMgr.applyHotfix(result, this.bundleUrl);
      this.currentVersion = result.version;
      platform.getStorageAPI().set('hotfix_version', result.version);
      return true;
    } catch (e) {
      this.bus.emit(ErrorEvents.HOTFIX_VERIFY_FAILED, { error: e });
      return false;
    }
  }

  async checkAndUpdateAuto(platform: IPlatform): Promise<boolean> {
    const resMgr = ResMgr.inst;
    const result = await resMgr.checkHotfix(this.versionUrl);

    if (!result.hasUpdate) return false;

    try {
      await resMgr.applyHotfix(result, this.bundleUrl);
      this.currentVersion = result.version;
      platform.getStorageAPI().set('hotfix_version', result.version);
      return true;
    } catch (e) {
      this.bus.emit(ErrorEvents.HOTFIX_VERIFY_FAILED, { error: e });
      return false;
    }
  }
}
