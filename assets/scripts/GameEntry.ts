import { _decorator, Component, JsonAsset } from 'cc';
import { Config } from './config/Config';
import { EventBus } from './core/EventBus';
import { ModuleManager } from './core/ModuleManager';
import { ResourceManager } from './core/ResourceManager';
import { UIManager } from './core/UIManager';
import type { IPlatform } from './platform/IPlatform';

const { ccclass } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends Component {
  private bus: EventBus = EventBus.inst;
  private platform: IPlatform | null = null;
  private mm: ModuleManager = ModuleManager.inst;

  async start() {
    await this.init();
  }

  async init(): Promise<void> {
    this.mm.onInit();

    // 2. UI
    UIManager.inst.init(this.node);

    let json: JsonAsset = await ResourceManager.inst.loadResource("config/config", JsonAsset);
    Config.parseData(JSON.stringify(json.json));



    // 3. 配置表加载完成后通知模块
    this.mm.onConfigLoaded();

    // 4. Platform — 由具体平台在编译时/运行时注入
    // this.platform = new AppPlatform() / new WeChatPlatform()
    // await this.platform.init();

    // 5. Hotfix
    // if (this.platform) {
    //   await HotfixManager.inst.checkAndUpdateAuto(this.platform);
    // }

    this.mm.onUserDataLoaded();

    // 6. 游戏开始
    this.bus.emit('game:ready');
    this.mm.onGameStart();
  }

  /** 切换账号 — 清理玩家数据 */
  cleanupAndReset(): void {
    this.mm.onCleanup();
    this.mm.onInit();
    this.bus.emit('game:ready');
    this.mm.onGameStart();
  }
}
