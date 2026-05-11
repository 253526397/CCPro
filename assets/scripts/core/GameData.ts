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
  private bus: EventBus = new EventBus();

  get hero(): HeroData {
    return this.heroes[this.currentHeroIndex];
  }

  getCurrency(type: string): number {
    return this._currencies.get(type) || 0;
  }

  setCurrency(type: string, amount: number): void {
    this._currencies.set(type, Math.max(0, amount));
    this.markDirty('currencies');
    this.bus.emit(ShopEvents.CURRENCY_CHANGED, { type, amount: this._currencies.get(type) });
  }

  addCurrency(type: string, amount: number): void {
    this.setCurrency(type, this.getCurrency(type) + amount);
  }

  hasEnough(type: string, amount: number): boolean {
    return this.getCurrency(type) >= amount;
  }

  spendCurrency(type: string, amount: number): boolean {
    if (!this.hasEnough(type, amount)) return false;
    this.setCurrency(type, this.getCurrency(type) - amount);
    return true;
  }

  markDirty(key: string): void {
    this.dirtyKeys.add(key);
  }

  isDirty(key: string): boolean {
    return this.dirtyKeys.has(key);
  }

  clearDirty(): void {
    this.dirtyKeys.clear();
  }

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

  fromSaveData(data: SaveData): void {
    if (data.hero) this.heroes[this.currentHeroIndex] = { ...data.hero };
    if (data.equips) this.equips = [...data.equips];
    if (data.currencies) {
      this._currencies.clear();
      Object.entries(data.currencies).forEach(([k, v]) => this._currencies.set(k, v));
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
