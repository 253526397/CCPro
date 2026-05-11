import { _decorator, Component, Node } from 'cc';
import { EventBus } from './core/EventBus';
import { UIManager } from './core/UIManager';
import { ConfigService } from './core/ConfigService';
import { HotfixManager } from './core/HotfixManager';
import type { IGameModule } from './core/IGameModule';
import type { IPlatform } from './platform/IPlatform';
import { ChestModule } from './modules/chest/ChestModule';
import { BattleModule } from './modules/battle/BattleModule';
import { EquipModule } from './modules/equip/EquipModule';
import { HeroModule } from './modules/hero/HeroModule';
import { StageModule } from './modules/stage/StageModule';
import { ShopModule } from './modules/shop/ShopModule';
import { QuestModule } from './modules/quest/QuestModule';
import { SkillModule } from './modules/skill/SkillModule';

const { ccclass } = _decorator;

@ccclass('GameEntry')
export class GameEntry extends Component {
  private bus: EventBus = EventBus.inst;
  private platform: IPlatform | null = null;
  private modules: IGameModule[] = [];

  async start() {
    await this.init();
  }

  /** 注册所有业务模块（按依赖顺序） */
  private initModules(): void {
    this.modules = [
      ChestModule.inst,
      BattleModule.inst,
      EquipModule.inst,
      HeroModule.inst,
      StageModule.inst,
      ShopModule.inst,
      QuestModule.inst,
      SkillModule.inst,
    ];
  }

  async init(): Promise<void> {
    // 1. 初始化模块实例
    this.initModules();

    // 2. 模块 onInit — 注册事件监听
    this.modules.forEach(m => m.onInit());

    // 3. UI
    UIManager.inst.init(this.node.getChildByName('Canvas') || this.node);

    // 4. 配置表加载完成后通知模块
    // TODO: await ConfigService.load()
    this.modules.forEach(m => m.onConfigLoaded());

    // 5. Platform — 由具体平台在编译时/运行时注入
    // this.platform = new AppPlatform() / new WeChatPlatform()
    // await this.platform.init();

    // 6. Hotfix
    if (this.platform) {
      await HotfixManager.inst.checkAndUpdateAuto(this.platform);
    }

    // 7. 游戏开始
    this.bus.emit('game:ready');
    this.modules.forEach(m => m.onGameStart());
  }

  /** 切换账号 — 清理玩家数据 */
  cleanupAndReset(): void {
    this.modules.forEach(m => m.onCleanup());
    this.modules.forEach(m => m.onInit());
    this.bus.emit('game:ready');
    this.modules.forEach(m => m.onGameStart());
  }
}
