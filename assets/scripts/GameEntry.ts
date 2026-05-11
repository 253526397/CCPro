import { _decorator, Component, Node } from 'cc';
import { EventBus } from './core/EventBus';
import { UIManager } from './core/UIManager';
import { ConfigService } from './core/ConfigService';
import { HotfixManager } from './core/HotfixManager';
import { IPlatform } from './platform/IPlatform';

const { ccclass } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends Component {
  private bus: EventBus = new EventBus();
  private platform: IPlatform | null = null;

  async start() {
    await this.init();
  }

  async init(): Promise<void> {
    // 1. Config
    ConfigService.inst;

    // 2. UI
    UIManager.inst.init(this.node.getChildByName('Canvas') || this.node);

    // 3. Platform — 由具体平台在编译时/运行时注入
    // this.platform = new AppPlatform() / new WeChatPlatform()
    // await this.platform.init();

    // 4. Hotfix
    if (this.platform) {
      await HotfixManager.inst.checkAndUpdateAuto(this.platform);
    }

    // 5. Game Ready
    this.bus.emit('game:ready');
  }
}
