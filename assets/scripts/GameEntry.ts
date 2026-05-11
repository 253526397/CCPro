import { _decorator, Component, Node } from 'cc';
import { EventBus } from './core/EventBus';
import { UIManager } from './core/UIManager';
import { HotfixManager } from './core/HotfixManager';
import { ModuleManager } from './core/ModuleManager';
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
  private mm: ModuleManager = ModuleManager.inst;

  async start() {
    await this.init();
  }

  /** 注册所有业务模块（按依赖顺序） */
  private registerModules(): void {
    this.mm.register(ChestModule);
    this.mm.register(BattleModule);
    this.mm.register(EquipModule);
    this.mm.register(HeroModule);
    this.mm.register(StageModule);
    this.mm.register(ShopModule);
    this.mm.register(QuestModule);
    this.mm.register(SkillModule);
  }

  async init(): Promise<void> {
    // 1. 注册并初始化模块
    this.registerModules();
    this.mm.onInit();

    // 2. UI
    UIManager.inst.init(this.node.getChildByName('Canvas') || this.node);

    // 3. 配置表加载完成后通知模块
    this.mm.onConfigLoaded();

    // 4. Platform — 由具体平台在编译时/运行时注入
    // this.platform = new AppPlatform() / new WeChatPlatform()
    // await this.platform.init();

    // 5. Hotfix
    if (this.platform) {
      await HotfixManager.inst.checkAndUpdateAuto(this.platform);
    }

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
