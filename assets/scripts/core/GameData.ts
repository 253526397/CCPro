import { EventBus } from './EventBus';
import {
  HeroData, EquipData, StageProgressData, QuestProgress,
  GameSettings, SaveData,
} from '../data';
import { ShopEvents } from '../events';

const DEFAULT_HERO: HeroData = {
  level: 1,
  exp: 0,
  nickname: '',
  avatar: 1,
  totalPower: 0,
};

const DEFAULT_STAGE: StageProgressData = {
  currentStageId: 1,
  passedStageIds: [],
};

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 80,
  sfxVolume: 100,
  autoBattleSpeed: 1,
};

/**
 * 全局数据中心，所有运行时游戏状态的首个数据源。
 * UI 层只读，业务模块通过 set/add/spend 方法修改。
 * 修改数据后自动 emit 对应事件通知 UI 刷新，同时通过脏标记追踪增量存盘。
 */
export class GameData {
  private static _inst: GameData;
  static get inst(): GameData {
    if (!this._inst) this._inst = new GameData();
    return this._inst;
  }

  heroes: HeroData[] = [{ ...DEFAULT_HERO }];
  currentHeroIndex: number = 0;
  equips: EquipData[] = [];
  private _currencies: Map<string, number> = new Map();
  stageProgress: StageProgressData = { ...DEFAULT_STAGE };
  questProgress: QuestProgress[] = [];
  settings: GameSettings = { ...DEFAULT_SETTINGS };
  lastSaveTime: number = 0;

  private dirtyKeys: Set<string> = new Set();
  private bus: EventBus = EventBus.inst;

  /** 当前角色数据（单英雄场景） */
  get hero(): HeroData {
    return this.heroes[this.currentHeroIndex];
  }

  /** 获取指定货币数量，未初始化时返回 0 */
  getCurrency(type: string): number {
    return this._currencies.get(type) || 0;
  }

  /** 设置货币为指定值，自动触发 CURRENCY_CHANGED 事件并标记脏数据 */
  setCurrency(type: string, amount: number): void {
    this._currencies.set(type, Math.max(0, amount));
    this.markDirty('currencies');
    this.bus.emit(ShopEvents.CURRENCY_CHANGED, { type, amount: this._currencies.get(type) });
  }

  /** 增加货币（正数加、负数减） */
  addCurrency(type: string, amount: number): void {
    this.setCurrency(type, this.getCurrency(type) + amount);
  }

  /** 检查货币是否足够 */
  hasEnough(type: string, amount: number): boolean {
    return this.getCurrency(type) >= amount;
  }

  /** 消费货币，不足时返回 false 不扣减 */
  spendCurrency(type: string, amount: number): boolean {
    if (!this.hasEnough(type, amount)) return false;
    this.setCurrency(type, this.getCurrency(type) - amount);
    return true;
  }

  /** 标记某类数据已变更（用于增量存盘） */
  markDirty(key: string): void {
    this.dirtyKeys.add(key);
  }

  /** 检查某类数据是否有未保存的变更 */
  isDirty(key: string): boolean {
    return this.dirtyKeys.has(key);
  }

  /** 清除所有脏标记（存盘后调用） */
  clearDirty(): void {
    this.dirtyKeys.clear();
  }

  /** 获取增量脏数据快照，仅包含变更过的字段 */
  getDirtySnapshot(): Partial<SaveData> {
    const data: Partial<SaveData> = {};
    if (this.isDirty('hero')) data.hero = this.hero;
    if (this.isDirty('equips')) data.equips = this.equips;
    if (this.isDirty('currencies')) {
      data.currencies = {};
      this._currencies.forEach((v, k) => data.currencies![k] = v);
    }
    if (this.isDirty('stageProgress')) data.stageProgress = this.stageProgress;
    if (this.isDirty('questProgress')) data.questProgress = this.questProgress;
    if (this.isDirty('settings')) data.settings = this.settings;
    return data;
  }

  /** 导出完整存盘数据（深拷贝，不会意外修改） */
  toSaveData(): SaveData {
    const currencies: Record<string, number> = {};
    this._currencies.forEach((v, k) => currencies[k] = v);

    return {
      hero: { ...this.hero },
      equips: [...this.equips],
      currencies,
      stageProgress: {
        ...this.stageProgress,
        passedStageIds: [...this.stageProgress.passedStageIds],
      },
      questProgress: [...this.questProgress],
      settings: { ...this.settings },
      lastSaveTime: Date.now(),
    };
  }

  /** 从存盘数据恢复游戏状态 */
  fromSaveData(data: SaveData): void {
    if (data.hero) this.heroes[this.currentHeroIndex] = { ...data.hero };
    if (data.equips) this.equips = [...data.equips];
    if (data.currencies) {
      this._currencies.clear();
      Object.keys(data.currencies).forEach(k => this._currencies.set(k, data.currencies![k]));
    }
    if (data.stageProgress) {
      this.stageProgress = {
        ...data.stageProgress,
        passedStageIds: [...data.stageProgress.passedStageIds],
      };
    }
    if (data.questProgress) this.questProgress = [...data.questProgress];
    if (data.settings) this.settings = { ...data.settings };
    this.lastSaveTime = data.lastSaveTime;
    this.clearDirty();
  }
}
