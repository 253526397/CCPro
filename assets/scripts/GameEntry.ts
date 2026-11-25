import { _decorator, Component } from 'cc';
import { Config } from './config/Config';
import EventManager from './core/EventManager';
import { ResourceManager } from './core/loader/ResourceManager';
import { ModuleManager } from './core/ModuleManager';
import { UIManager } from './core/UIManager';
import { GameRuntimeEvents } from './events/EventConst';
import type { IPlatform } from './platform/IPlatform';

const { ccclass } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends Component {
  private platform: IPlatform | null = null;
  async start() {
    await this.init();
  }

  async init(): Promise<void> {

    ResourceManager.inst.initBundles("");

    ModuleManager.inst.onInit();

    // 2. UI
    UIManager.inst.init(this.node);

    let configText: string = await ResourceManager.inst.loadText("resources/config/config.txt");
    Config.parseData(JSON.stringify(configText));



    // 3. 配置表加载完成后通知模块
    ModuleManager.inst.onConfigLoaded();

    // 4. Platform — 由具体平台在编译时/运行时注入
    // this.platform = new AppPlatform() / new WeChatPlatform()
    // await this.platform.init();

    // 5. Hotfix
    // if (this.platform) {
    //   await HotfixManager.inst.checkAndUpdateAuto(this.platform);
    // }

    ModuleManager.inst.onUserDataLoaded();

    // 6. 游戏开始
    EventManager.emit(GameRuntimeEvents.GAME_READY);
    ModuleManager.inst.onGameStart();
  }

  /** 切换账号 — 清理玩家数据 */
  cleanupAndReset(): void {
    ModuleManager.inst.onCleanup();
    ModuleManager.inst.onInit();
    EventManager.emit(GameRuntimeEvents.GAME_READY);
    ModuleManager.inst.onGameStart();
  }
}
