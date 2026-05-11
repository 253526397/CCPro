import { ResMgr } from './ResMgr';
import { IPlatform } from '../platform/IPlatform';
import { EventBus } from './EventBus';
import { ErrorEvents } from '../events';

/**
 * 热更管理器，封装远程资源更新策略。
 * 两种模式：
 * - checkAndUpdate: 需用户确认后才更新（大版本更新）
 * - checkAndUpdateAuto: 静默自动更新（bugfix/小更新）
 */
export class HotfixManager {
  private static _inst: HotfixManager;
  static get inst(): HotfixManager {
    if (!this._inst) this._inst = new HotfixManager();
    return this._inst;
  }

  private bus: EventBus = EventBus.inst;
  private versionUrl: string = '';
  private bundleUrl: string = '';
  private currentVersion: string = '0.0.0';

  /** 设置版本查询地址与远程 Bundle 下载地址 */
  configure(versionUrl: string, bundleUrl: string): void {
    this.versionUrl = versionUrl;
    this.bundleUrl = bundleUrl;
  }

  /** 获取当前已激活的热更版本号 */
  getVersion(): string {
    return this.currentVersion;
  }

  /**
   * 检查更新，仅当用户已授权（hotfix_approved）时才下载应用。
   * 适用于大版本更新场景。
   */
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

  /**
   * 静默检查并自动更新，不需要用户手动确认。
   * 适用于 bugfix 或增量小更新场景，在启动时调用。
   */
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
