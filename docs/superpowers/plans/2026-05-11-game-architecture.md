# 游戏架构骨架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建新项目的模块化架构骨架——EventBus 事件总线、UIManager、GameData 数据中心、IPlatform 平台抽象层、ResMgr 资源管理，以及所有核心模块的空壳脚手架。

**Architecture:** 模块化 + 事件驱动。业务模块之间通过 EventBus 通信，UI 通过 UIManager 统一管理，平台差异收敛到 IPlatform 接口，所有运行时状态集中在 GameData 单一数据源。

**Tech Stack:** Cocos Creator 3.8.8, TypeScript (strict: false)

---

### Task 1: 创建项目目录结构

**Files:**
- Create: `assets/scripts/core/` (空目录，占位 .gitkeep)
- Create: `assets/scripts/modules/` (空目录)
- Create: `assets/scripts/platform/` (空目录)
- Create: `assets/scripts/events/` (空目录)
- Create: `assets/scripts/data/` (空目录)
- Create: `assets/scripts/ui/` (空目录)
- Create: `assets/res/` (空目录)
- Create: `tests/core/` (空目录)
- Create: `tests/modules/` (空目录)

- [ ] **Step 1: 创建所有目录**

```bash
mkdir -p assets/scripts/core \
         assets/scripts/modules/chest \
         assets/scripts/modules/battle \
         assets/scripts/modules/equip \
         assets/scripts/modules/hero \
         assets/scripts/modules/stage \
         assets/scripts/modules/shop \
         assets/scripts/modules/quest \
         assets/scripts/modules/skill \
         assets/scripts/platform \
         assets/scripts/events \
         assets/scripts/data \
         assets/scripts/ui \
         assets/res/modules \
         assets/res/common \
         assets/res/config \
         tests/core \
         tests/modules
```

- [ ] **Step 2: 创建占位 .gitkeep 文件（确保空目录被 git 追踪）**

```bash
touch assets/scripts/core/.gitkeep \
      assets/res/modules/.gitkeep \
      assets/res/common/.gitkeep \
      assets/res/config/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add assets/ scripts/ tests/
git commit -m "chore: create project directory structure"
```

---

### Task 2: 实现 EventBus

**Files:**
- Create: `assets/scripts/core/EventBus.ts`
- Create: `tests/core/eventbus.test.ts`

- [ ] **Step 1: 写 EventBus 测试**

```typescript
// tests/core/eventbus.test.ts
import { EventBus } from '../../assets/scripts/core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should register and trigger an event', () => {
    let called = false;
    bus.on('test:event', () => { called = true; });
    bus.emit('test:event');
    expect(called).toBe(true);
  });

  it('should pass arguments to callback', () => {
    let received: any = null;
    bus.on('test:data', (data: any) => { received = data; });
    bus.emit('test:data', { value: 42 });
    expect(received).toEqual({ value: 42 });
  });

  it('should support multiple subscribers for same event', () => {
    let count = 0;
    bus.on('test:multi', () => { count++; });
    bus.on('test:multi', () => { count++; });
    bus.emit('test:multi');
    expect(count).toBe(2);
  });

  it('should unregister a specific callback', () => {
    let count = 0;
    const cb = () => { count++; };
    bus.on('test:event', cb);
    bus.off('test:event', cb);
    bus.emit('test:event');
    expect(count).toBe(0);
  });

  it('should unregister all callbacks when target is provided', () => {
    const obj = {};
    let count = 0;
    bus.on('test:event', () => { count++; }, obj);
    bus.on('test:event', () => { count++; }, obj);
    bus.off('test:event', undefined, obj);
    bus.emit('test:event');
    expect(count).toBe(0);
  });

  it('should do nothing when emitting non-existent event', () => {
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('should handle multiple arguments', () => {
    let a = 0, b = '';
    bus.on('test:multiArg', (n: number, s: string) => { a = n; b = s; });
    bus.emit('test:multiArg', 1, 'hello');
    expect(a).toBe(1);
    expect(b).toBe('hello');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/core/eventbus.test.ts
```

预期: 全部 FAIL（EventBus 不存在）

- [ ] **Step 3: 实现 EventBus**

```typescript
// assets/scripts/core/EventBus.ts

type EventCallback = (...args: any[]) => void;

interface EventEntry {
  callback: EventCallback;
  target?: object;
}

export class EventBus {
  private events: Map<string, EventEntry[]> = new Map();

  on(event: string, callback: EventCallback, target?: object): void {
    const entries = this.events.get(event) || [];
    entries.push({ callback, target });
    this.events.set(event, entries);
  }

  off(event: string, callback?: EventCallback, target?: object): void {
    if (!this.events.has(event)) return;

    const entries = this.events.get(event)!;

    if (!callback && !target) {
      this.events.delete(event);
      return;
    }

    const filtered = entries.filter(entry => {
      if (target && entry.target !== target) return true;
      if (callback && entry.callback !== callback) return true;
      return false;
    });

    this.events.set(event, filtered);
  }

  emit(event: string, ...args: any[]): void {
    const entries = this.events.get(event);
    if (!entries) return;

    for (const entry of entries) {
      entry.callback(...args);
    }
  }

  destroy(): void {
    this.events.clear();
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/core/eventbus.test.ts
```

预期: 7 个 PASS

- [ ] **Step 5: Commit**

```bash
git add assets/scripts/core/EventBus.ts tests/core/eventbus.test.ts
git commit -m "feat: add EventBus with unit tests"
```

---

### Task 3: 定义 IPlatform 接口

**Files:**
- Create: `assets/scripts/platform/IPlatform.ts`

- [ ] **Step 1: 定义 IPlatform 接口**

```typescript
// assets/scripts/platform/IPlatform.ts

export interface IAdAPI {
  /** 播放激励视频，返回是否完整观看 */
  showRewardedVideo(placement: string): Promise<boolean>;
  /** 显示插屏广告 */
  showInterstitial(placement: string): Promise<void>;
}

export interface IIAPAPI {
  /** 查询商品列表 */
  fetchProducts(productIds: string[]): Promise<ProductInfo[]>;
  /** 发起购买 */
  purchase(productId: string): Promise<PurchaseResult>;
  /** 恢复购买 */
  restorePurchases(): Promise<PurchaseResult[]>;
}

export interface IAuthAPI {
  /** 登录，返回 token */
  login(): Promise<AuthResult>;
  /** 登出 */
  logout(): Promise<void>;
  /** 是否已登录 */
  isLoggedIn(): boolean;
  /** 获取用户信息 */
  getUserInfo(): UserInfo | null;
}

export interface IShareAPI {
  /** 分享，返回是否成功 */
  share(options: ShareOptions): Promise<boolean>;
}

export interface IStorageAPI {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
}

export interface IPlatform {
  getPlatformId(): PlatformId;
  getAdAPI(): IAdAPI;
  getIAPAPI(): IIAPAPI;
  getAuthAPI(): IAuthAPI;
  getShareAPI(): IShareAPI;
  getStorageAPI(): IStorageAPI;
  getDeviceInfo(): DeviceInfo;
  init(): Promise<void>;
}

export type PlatformId = 'app' | 'h5' | 'wechat' | 'douyin';

export interface ProductInfo {
  productId: string;
  price: string;
  currency: string;
  title: string;
}

export interface PurchaseResult {
  productId: string;
  transactionId: string;
  success: boolean;
}

export interface AuthResult {
  token: string;
  userId: string;
}

export interface UserInfo {
  userId: string;
  nickname: string;
  avatar: string;
}

export interface ShareOptions {
  title: string;
  imageUrl?: string;
  query?: string;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  deviceModel: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/platform/IPlatform.ts
git commit -m "feat: define IPlatform interface"
```

---

### Task 4: 定义所有事件常量

**Files:**
- Create: `assets/scripts/events/chest-events.ts`
- Create: `assets/scripts/events/battle-events.ts`
- Create: `assets/scripts/events/equip-events.ts`
- Create: `assets/scripts/events/hero-events.ts`
- Create: `assets/scripts/events/stage-events.ts`
- Create: `assets/scripts/events/shop-events.ts`
- Create: `assets/scripts/events/quest-events.ts`
- Create: `assets/scripts/events/net-events.ts`
- Create: `assets/scripts/events/error-events.ts`
- Create: `assets/scripts/events/index.ts`

- [ ] **Step 1: 依次创建各模块事件文件**

```typescript
// assets/scripts/events/chest-events.ts
export const ChestEvents = {
  OPENED: 'chest:opened',
  EQUIP_OBTAINED: 'chest:equipObtained',
} as const;

// assets/scripts/events/battle-events.ts
export const BattleEvents = {
  STARTED: 'battle:started',
  FINISHED: 'battle:finished',
  DAMAGE_DEALT: 'battle:damageDealt',
  ENEMY_DEFEATED: 'battle:enemyDefeated',
} as const;

// assets/scripts/events/equip-events.ts
export const EquipEvents = {
  UPGRADED: 'equip:upgraded',
  DISMANTLED: 'equip:dismantled',
  QUALITY_UP: 'equip:qualityUp',
  EQUIPPED: 'equip:equipped',
  UNEQUIPPED: 'equip:unequipped',
} as const;

// assets/scripts/events/hero-events.ts
export const HeroEvents = {
  LEVEL_UP: 'hero:levelUp',
  ATTR_CHANGED: 'hero:attrChanged',
  EQUIP_CHANGED: 'hero:equipChanged',
  POWER_CHANGED: 'hero:powerChanged',
} as const;

// assets/scripts/events/stage-events.ts
export const StageEvents = {
  PASSED: 'stage:passed',
  REWARDED: 'stage:rewarded',
  UNLOCKED: 'stage:unlocked',
} as const;

// assets/scripts/events/shop-events.ts
export const ShopEvents = {
  PURCHASED: 'shop:purchased',
  CURRENCY_CHANGED: 'currency:changed',
} as const;

// assets/scripts/events/quest-events.ts
export const QuestEvents = {
  PROGRESS: 'quest:progress',
  COMPLETED: 'quest:completed',
  CLAIMED: 'quest:claimed',
} as const;

// assets/scripts/events/net-events.ts
export const NetEvents = {
  CONNECTED: 'net:connected',
  DISCONNECTED: 'net:disconnected',
  REQUEST_FAILED: 'net:requestFailed',
  CLOUD_SAVE_DONE: 'net:cloudSaveDone',
  CONFLICT_DETECTED: 'net:conflictDetected',
} as const;

// assets/scripts/events/error-events.ts
export const ErrorEvents = {
  STORAGE_QUOTA_EXCEEDED: 'storage:quotaExceeded',
  HOTFIX_VERIFY_FAILED: 'hotfix:verifyFailed',
  IAP_RESTORE_FAILED: 'iap:restoreFailed',
  RESOURCE_LOAD_FAILED: 'resource:loadFailed',
} as const;

// assets/scripts/events/index.ts
export { ChestEvents } from './chest-events';
export { BattleEvents } from './battle-events';
export { EquipEvents } from './equip-events';
export { HeroEvents } from './hero-events';
export { StageEvents } from './stage-events';
export { ShopEvents } from './shop-events';
export { QuestEvents } from './quest-events';
export { NetEvents } from './net-events';
export { ErrorEvents } from './error-events';
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/events/
git commit -m "feat: define all event constants"
```

---

### Task 5: 定义 GameData 数据类型

**Files:**
- Create: `assets/scripts/data/HeroData.ts`
- Create: `assets/scripts/data/EquipData.ts`
- Create: `assets/scripts/data/StageData.ts`
- Create: `assets/scripts/data/QuestData.ts`
- Create: `assets/scripts/data/SaveData.ts`
- Create: `assets/scripts/data/index.ts`

- [ ] **Step 1: 定义所有数据类型**

```typescript
// assets/scripts/data/HeroData.ts
export interface HeroData {
  level: number;
  exp: number;
  nickname: string;
  avatar: number;
  totalPower: number;
}

// assets/scripts/data/EquipData.ts
export enum EquipSlot {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  RING = 'ring',
  BOOTS = 'boots',
}

export enum EquipQuality {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

export interface EquipData {
  id: string;
  name: string;
  slot: EquipSlot;
  quality: EquipQuality;
  level: number;
  attrs: EquipAttr[];
  isEquipped: boolean;
}

export interface EquipAttr {
  type: AttrType;
  value: number;
}

export enum AttrType {
  ATK = 'atk',
  DEF = 'def',
  HP = 'hp',
  CRIT_RATE = 'critRate',
  CRIT_DMG = 'critDmg',
  SPEED = 'speed',
}

// assets/scripts/data/StageData.ts
export interface StageData {
  stageId: number;
  name: string;
  isUnlocked: boolean;
  isPassed: boolean;
  enemies: StageEnemy[];
  rewards: StageReward[];
}

export interface StageEnemy {
  id: number;
  name: string;
  hp: number;
  atk: number;
  def: number;
  speed: number;
}

export interface StageReward {
  type: 'gold' | 'equip' | 'exp';
  amount: number;
  equipId?: string;
}

export interface StageProgressData {
  currentStageId: number;
  passedStageIds: number[];
}

// assets/scripts/data/QuestData.ts
export enum QuestType {
  DAILY = 'daily',
  GROWTH = 'growth',
  ACHIEVEMENT = 'achievement',
}

export enum QuestCondition {
  OPEN_CHEST = 'openChest',
  WIN_BATTLE = 'winBattle',
  UPGRADE_EQUIP = 'upgradeEquip',
  REACH_STAGE = 'reachStage',
  SPEND_GOLD = 'spendGold',
}

export interface QuestData {
  questId: string;
  type: QuestType;
  condition: QuestCondition;
  targetCount: number;
  rewards: { type: string; amount: number }[];
}

export interface QuestProgress {
  questId: string;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
}

// assets/scripts/data/SaveData.ts
export interface SaveData {
  hero: HeroData;
  equips: EquipData[];
  currencies: Record<string, number>;
  stageProgress: StageProgressData;
  questProgress: QuestProgress[];
  settings: GameSettings;
  lastSaveTime: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoBattleSpeed: number;
}

export enum CurrencyType {
  GOLD = 'gold',
  DIAMOND = 'diamond',
  CHEST_KEY = 'chestKey',
}

// assets/scripts/data/index.ts
export { HeroData } from './HeroData';
export { EquipData, EquipSlot, EquipQuality, EquipAttr, AttrType } from './EquipData';
export { StageData, StageEnemy, StageReward, StageProgressData } from './StageData';
export { QuestData, QuestProgress, QuestType, QuestCondition } from './QuestData';
export { SaveData, GameSettings, CurrencyType } from './SaveData';
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/data/
git commit -m "feat: define GameData types"
```

---

### Task 6: 实现 GameData

**Files:**
- Create: `assets/scripts/core/GameData.ts`
- Create: `tests/core/gamedata.test.ts`

- [ ] **Step 1: 写 GameData 测试**

```typescript
// tests/core/gamedata.test.ts
import { GameData } from '../../assets/scripts/core/GameData';

describe('GameData', () => {
  let gd: GameData;

  beforeEach(() => {
    gd = new GameData();
  });

  it('should initialize with default hero data', () => {
    expect(gd.hero.level).toBe(1);
    expect(gd.hero.exp).toBe(0);
  });

  it('should set and get currency', () => {
    gd.setCurrency('gold', 100);
    expect(gd.getCurrency('gold')).toBe(100);
  });

  it('should add currency', () => {
    gd.setCurrency('gold', 100);
    gd.addCurrency('gold', 50);
    expect(gd.getCurrency('gold')).toBe(150);
  });

  it('should check if has enough currency', () => {
    gd.setCurrency('gold', 100);
    expect(gd.hasEnough('gold', 50)).toBe(true);
    expect(gd.hasEnough('gold', 200)).toBe(false);
  });

  it('should spend currency', () => {
    gd.setCurrency('gold', 100);
    expect(gd.spendCurrency('gold', 30)).toBe(true);
    expect(gd.getCurrency('gold')).toBe(70);
  });

  it('should not spend more than available', () => {
    gd.setCurrency('gold', 10);
    expect(gd.spendCurrency('gold', 20)).toBe(false);
    expect(gd.getCurrency('gold')).toBe(10);
  });

  it('should track dirty keys', () => {
    gd.setCurrency('gold', 100);
    expect(gd.isDirty('currencies')).toBe(true);
    gd.clearDirty();
    expect(gd.isDirty('currencies')).toBe(false);
  });

  it('should produce save snapshot', () => {
    gd.hero.level = 5;
    gd.setCurrency('gold', 100);
    const snapshot = gd.toSaveData();
    expect(snapshot.hero.level).toBe(5);
    expect(snapshot.currencies['gold']).toBe(100);
  });

  it('should restore from save data', () => {
    const save = gd.toSaveData();
    save.hero.level = 10;
    gd.fromSaveData(save);
    expect(gd.hero.level).toBe(10);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/core/gamedata.test.ts
```

- [ ] **Step 3: 实现 GameData**

```typescript
// assets/scripts/core/GameData.ts
import { EventBus } from './EventBus';
import { HeroData, EquipData, StageProgressData, QuestProgress, GameSettings, SaveData } from '../data';
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
      stageProgress: { ...this.stageProgress, passedStageIds: [...this.stageProgress.passedStageIds] },
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
      this.stageProgress = { ...data.stageProgress, passedStageIds: [...data.stageProgress.passedStageIds] };
    }
    if (data.questProgress) this.questProgress = [...data.questProgress];
    if (data.settings) this.settings = { ...data.settings };
    this.lastSaveTime = data.lastSaveTime;
    this.clearDirty();
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/core/gamedata.test.ts
```

预期: 8 个 PASS

- [ ] **Step 5: Commit**

```bash
git add assets/scripts/core/GameData.ts tests/core/gamedata.test.ts
git commit -m "feat: add GameData with unit tests"
```

---

### Task 7: 实现 UIManager

**Files:**
- Create: `assets/scripts/core/UIManager.ts`

- [ ] **Step 1: 实现 UIManager**

```typescript
// assets/scripts/core/UIManager.ts
import { _decorator, Component, Prefab, Node, instantiate, Canvas } from 'cc';

export enum UILayer {
  BACKGROUND = 0,
  SCENE = 1,
  HUD = 2,
  DIALOG = 3,
  FLOAT = 4,
  TIPS = 5,
  LOADING = 6,
}

const LAYER_ORDER: Record<UILayer, number> = {
  [UILayer.BACKGROUND]: 0,
  [UILayer.SCENE]: 100,
  [UILayer.HUD]: 200,
  [UILayer.DIALOG]: 300,
  [UILayer.FLOAT]: 400,
  [UILayer.TIPS]: 500,
  [UILayer.LOADING]: 600,
};

export class UIManager {
  private static _inst: UIManager;
  static get inst(): UIManager {
    if (!this._inst) this._inst = new UIManager();
    return this._inst;
  }

  private layers: Map<UILayer, Node> = new Map();
  private uiRegistry: Map<string, Node> = new Map();
  private canvasNode: Node | null = null;

  init(canvas: Node): void {
    this.canvasNode = canvas;

    Object.values(UILayer).forEach((layer) => {
      if (typeof layer === 'number') {
        const node = new Node(`Layer_${UILayer[layer]}`);
        node.setParent(canvas);
        node.setSiblingIndex(LAYER_ORDER[layer as UILayer]);
        this.layers.set(layer as UILayer, node);
      }
    });
  }

  register(key: string, ui: Node): void {
    this.uiRegistry.set(key, ui);
  }

  unregister(key: string): void {
    this.uiRegistry.delete(key);
  }

  get<T extends Node>(key: string): T | null {
    return (this.uiRegistry.get(key) as T) || null;
  }

  addToLayer(ui: Node, layer: UILayer): void {
    const layerNode = this.layers.get(layer);
    if (layerNode) {
      ui.setParent(layerNode);
    }
  }

  async open(key: string, prefab: Prefab): Promise<Node | null> {
    const existing = this.uiRegistry.get(key);
    if (existing && existing.active) return existing;

    const node = instantiate(prefab);
    if (!node) return null;

    node.name = key;
    const dialog = this.guessLayerFor(key);
    this.addToLayer(node, dialog);
    this.register(key, node);
    return node;
  }

  close(key: string): void {
    const ui = this.uiRegistry.get(key);
    if (ui) {
      ui.active = false;
    }
  }

  closeAll(layer?: UILayer): void {
    if (layer !== undefined) {
      const layerNode = this.layers.get(layer);
      if (layerNode) {
        layerNode.children.forEach(child => (child.active = false));
      }
    } else {
      this.uiRegistry.forEach(ui => (ui.active = false));
    }
  }

  private guessLayerFor(key: string): UILayer {
    const lower = key.toLowerCase();
    if (lower.includes('loading') || lower.includes('mask')) return UILayer.LOADING;
    if (lower.includes('tips') || lower.includes('toast')) return UILayer.TIPS;
    if (lower.includes('confirm') || lower.includes('alert')) return UILayer.FLOAT;
    if (lower.includes('dialog') || lower.includes('panel') || lower.includes('result')) return UILayer.DIALOG;
    if (lower.includes('hud') || lower.includes('bar') || lower.includes('button')) return UILayer.HUD;
    return UILayer.SCENE;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/core/UIManager.ts
git commit -m "feat: add UIManager with layer management"
```

---

### Task 8: 实现 ResMgr

**Files:**
- Create: `assets/scripts/core/ResMgr.ts`

- [ ] **Step 1: 实现 ResMgr**

```typescript
// assets/scripts/core/ResMgr.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/core/ResMgr.ts
git commit -m "feat: add ResMgr with hotfix support"
```

---

### Task 9: 实现 NetService 和 ConfigService

**Files:**
- Create: `assets/scripts/core/NetService.ts`
- Create: `assets/scripts/core/ConfigService.ts`

- [ ] **Step 1: 实现 NetService**

```typescript
// assets/scripts/core/NetService.ts
import { EventBus } from './EventBus';
import { NetEvents } from '../events';

export interface NetResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class NetService {
  private static _inst: NetService;
  static get inst(): NetService {
    if (!this._inst) this._inst = new NetService();
    return this._inst;
  }

  private baseUrl: string = '';
  private bus: EventBus = new EventBus();

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<NetResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T = any>(path: string, body?: any): Promise<NetResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, string>
  ): Promise<NetResponse<T>> {
    let url = this.baseUrl + path;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += '?' + query;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const options: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        return json as NetResponse<T>;
      } catch (e: any) {
        lastError = e;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    this.bus.emit(NetEvents.REQUEST_FAILED, { url, error: lastError?.message });
    return { code: -1, data: null as any, message: lastError?.message || 'Network error' };
  }
}
```

- [ ] **Step 2: 实现 ConfigService**

```typescript
// assets/scripts/core/ConfigService.ts
export class ConfigService {
  private static _inst: ConfigService;
  static get inst(): ConfigService {
    if (!this._inst) this._inst = new ConfigService();
    return this._inst;
  }

  private store: Map<string, Map<number, any>> = new Map();

  registerTable<T extends { id: number }>(tableName: string, rows: T[]): void {
    const map = new Map<number, T>();
    rows.forEach(row => map.set(row.id, row));
    this.store.set(tableName, map);
  }

  get<T>(tableName: string, id: number): T | undefined {
    const table = this.store.get(tableName);
    if (!table) return undefined;
    return table.get(id) as T;
  }

  getAll<T>(tableName: string): T[] {
    const table = this.store.get(tableName);
    if (!table) return [];
    return Array.from(table.values()) as T[];
  }

  find<T>(tableName: string, predicate: (item: T) => boolean): T | undefined {
    const all = this.getAll<T>(tableName);
    return all.find(predicate);
  }

  has(tableName: string, id: number): boolean {
    const table = this.store.get(tableName);
    return table ? table.has(id) : false;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add assets/scripts/core/NetService.ts assets/scripts/core/ConfigService.ts
git commit -m "feat: add NetService and ConfigService"
```

---

### Task 10: 实现 HotfixManager

**Files:**
- Create: `assets/scripts/core/HotfixManager.ts`

- [ ] **Step 1: 实现 HotfixManager**

```typescript
// assets/scripts/core/HotfixManager.ts
import { ResMgr, HotfixResult } from './ResMgr';
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
      // 需要用户确认（由 UI 层处理）
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
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/core/HotfixManager.ts
git commit -m "feat: add HotfixManager"
```

---

### Task 11: 实现 GameEntry 启动入口

**Files:**
- Create: `assets/scripts/GameEntry.ts`

- [ ] **Step 1: 实现 GameEntry**

```typescript
// assets/scripts/GameEntry.ts
import { _decorator, Component, Node } from 'cc';
import { EventBus } from './core/EventBus';
import { UIManager } from './core/UIManager';
import { GameData } from './core/GameData';
import { ConfigService } from './core/ConfigService';
import { ResMgr } from './core/ResMgr';
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
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/GameEntry.ts
git commit -m "feat: add GameEntry startup sequence"
```

---

### Task 12: 创建核心模块空壳脚手架

**Files:**
- Create: `assets/scripts/modules/chest/ChestSystem.ts`
- Create: `assets/scripts/modules/battle/BattleSystem.ts`
- Create: `assets/scripts/modules/equip/EquipSystem.ts`
- Create: `assets/scripts/modules/hero/HeroSystem.ts`
- Create: `assets/scripts/modules/stage/StageSystem.ts`
- Create: `assets/scripts/modules/shop/ShopSystem.ts`
- Create: `assets/scripts/modules/quest/QuestSystem.ts`
- Create: `assets/scripts/modules/skill/SkillSystem.ts`

- [ ] **Step 1: 创建所有模块空壳**

```typescript
// assets/scripts/modules/chest/ChestSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { ChestEvents } from '../../events';

export class ChestSystem {
  private static _inst: ChestSystem;
  static get inst(): ChestSystem {
    if (!this._inst) this._inst = new ChestSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  openChest(type: string): void {
    // TODO: implement chest opening logic
  }
}

// assets/scripts/modules/battle/BattleSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { BattleEvents } from '../../events';

export enum BattleState {
  IDLE = 'idle',
  FIGHTING = 'fighting',
  FINISHED = 'finished',
}

export class BattleSystem {
  private static _inst: BattleSystem;
  static get inst(): BattleSystem {
    if (!this._inst) this._inst = new BattleSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;
  state: BattleState = BattleState.IDLE;

  start(stageId: number): void {
    this.state = BattleState.FIGHTING;
    this.bus.emit(BattleEvents.STARTED, { stageId });
  }

  finish(win: boolean): void {
    this.state = BattleState.FINISHED;
    this.bus.emit(BattleEvents.FINISHED, { win });
  }
}

// assets/scripts/modules/equip/EquipSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { EquipEvents } from '../../events';

export class EquipSystem {
  private static _inst: EquipSystem;
  static get inst(): EquipSystem {
    if (!this._inst) this._inst = new EquipSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  upgradeEquip(equipId: string): void {
    // TODO: implement upgrade logic
  }

  dismantleEquip(equipId: string): void {
    // TODO: implement dismantle logic
  }
}

// assets/scripts/modules/hero/HeroSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { HeroEvents } from '../../events';

export class HeroSystem {
  private static _inst: HeroSystem;
  static get inst(): HeroSystem {
    if (!this._inst) this._inst = new HeroSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  addExp(amount: number): void {
    this.gd.hero.exp += amount;
    // TODO: check level up
  }

  recalcPower(): number {
    let power = 0;
    this.gd.equips
      .filter(e => e.isEquipped)
      .forEach(e => {
        e.attrs.forEach(a => power += a.value);
      });
    this.gd.hero.totalPower = power;
    this.bus.emit(HeroEvents.POWER_CHANGED, { power });
    return power;
  }
}

// assets/scripts/modules/stage/StageSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { StageEvents } from '../../events';

export class StageSystem {
  private static _inst: StageSystem;
  static get inst(): StageSystem {
    if (!this._inst) this._inst = new StageSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  passStage(stageId: number): void {
    if (!this.gd.stageProgress.passedStageIds.includes(stageId)) {
      this.gd.stageProgress.passedStageIds.push(stageId);
    }
    this.gd.stageProgress.currentStageId = stageId + 1;
    this.bus.emit(StageEvents.PASSED, { stageId });
  }

  unlockStage(stageId: number): void {
    this.bus.emit(StageEvents.UNLOCKED, { stageId });
  }
}

// assets/scripts/modules/shop/ShopSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { IPlatform } from '../../platform/IPlatform';
import { ShopEvents } from '../../events';

export class ShopSystem {
  private static _inst: ShopSystem;
  static get inst(): ShopSystem {
    if (!this._inst) this._inst = new ShopSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;
  private platform: IPlatform | null = null;

  setPlatform(p: IPlatform): void {
    this.platform = p;
  }

  buyWithGold(itemId: string, cost: number): boolean {
    if (!this.gd.spendCurrency('gold', cost)) return false;
    // TODO: give item
    this.bus.emit(ShopEvents.PURCHASED, { itemId, currency: 'gold', cost });
    return true;
  }

  buyWithDiamond(itemId: string, cost: number): boolean {
    if (!this.gd.spendCurrency('diamond', cost)) return false;
    // TODO: give item
    this.bus.emit(ShopEvents.PURCHASED, { itemId, currency: 'diamond', cost });
    return true;
  }
}

// assets/scripts/modules/quest/QuestSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { QuestProgress, QuestCondition } from '../../data';
import { QuestEvents } from '../../events';

export class QuestSystem {
  private static _inst: QuestSystem;
  static get inst(): QuestSystem {
    if (!this._inst) this._inst = new QuestSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  updateProgress(condition: QuestCondition, count: number): void {
    this.gd.questProgress
      .filter(q => !q.completed && !q.claimed)
      .forEach(q => {
        q.currentCount += count;
        this.bus.emit(QuestEvents.PROGRESS, q);
        if (q.currentCount >= this.getQuestTarget(q.questId)) {
          q.completed = true;
          this.bus.emit(QuestEvents.COMPLETED, q);
        }
      });
  }

  claimReward(questId: string): void {
    const q = this.gd.questProgress.find(p => p.questId === questId);
    if (!q || !q.completed || q.claimed) return;
    q.claimed = true;
    this.bus.emit(QuestEvents.CLAIMED, { questId });
  }

  private getQuestTarget(questId: string): number {
    // TODO: look up from config
    return 1;
  }
}

// assets/scripts/modules/skill/SkillSystem.ts
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';

export class SkillSystem {
  private static _inst: SkillSystem;
  static get inst(): SkillSystem {
    if (!this._inst) this._inst = new SkillSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  // TODO: implement skill system
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/modules/
git commit -m "feat: add module scaffold shells"
```

---

### Task 13: 创建平台实现壳

**Files:**
- Create: `assets/scripts/platform/AppPlatform.ts`
- Create: `assets/scripts/platform/H5Platform.ts`
- Create: `assets/scripts/platform/WeChatPlatform.ts`

- [ ] **Step 1: 创建平台实现**

```typescript
// assets/scripts/platform/AppPlatform.ts
import {
  IPlatform, IAdAPI, IIAPAPI, IAuthAPI,
  IShareAPI, IStorageAPI, PlatformId, DeviceInfo
} from './IPlatform';

class AppStorageAPI implements IStorageAPI {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  remove(key: string): void {
    localStorage.removeItem(key);
  }
  clear(): void {
    localStorage.clear();
  }
}

export class AppPlatform implements IPlatform {
  private storage: IStorageAPI = new AppStorageAPI();

  getPlatformId(): PlatformId { return 'app'; }

  getAdAPI(): IAdAPI {
    throw new Error('AdAPI not implemented for app');
  }

  getIAPAPI(): IIAPAPI {
    throw new Error('IAPAPI not implemented for app');
  }

  getAuthAPI(): IAuthAPI {
    throw new Error('AuthAPI not implemented for app');
  }

  getShareAPI(): IShareAPI {
    throw new Error('ShareAPI not implemented for app');
  }

  getStorageAPI(): IStorageAPI {
    return this.storage;
  }

  getDeviceInfo(): DeviceInfo {
    return { platform: 'app', osVersion: '', deviceModel: '' };
  }

  async init(): Promise<void> {}
}

// assets/scripts/platform/H5Platform.ts
import {
  IPlatform, IAdAPI, IIAPAPI, IAuthAPI,
  IShareAPI, IStorageAPI, PlatformId, DeviceInfo
} from './IPlatform';

class H5StorageAPI implements IStorageAPI {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  remove(key: string): void {
    localStorage.removeItem(key);
  }
  clear(): void {
    localStorage.clear();
  }
}

export class H5Platform implements IPlatform {
  private storage: IStorageAPI = new H5StorageAPI();

  getPlatformId(): PlatformId { return 'h5'; }

  getAdAPI(): IAdAPI {
    throw new Error('AdAPI not implemented for H5');
  }

  getIAPAPI(): IIAPAPI {
    throw new Error('IAPAPI not implemented for H5');
  }

  getAuthAPI(): IAuthAPI {
    throw new Error('AuthAPI not implemented for H5');
  }

  getShareAPI(): IShareAPI {
    throw new Error('ShareAPI not implemented for H5');
  }

  getStorageAPI(): IStorageAPI {
    return this.storage;
  }

  getDeviceInfo(): DeviceInfo {
    return { platform: 'h5', osVersion: '', deviceModel: '' };
  }

  async init(): Promise<void> {}
}

// assets/scripts/platform/WeChatPlatform.ts
import {
  IPlatform, IAdAPI, IIAPAPI, IAuthAPI,
  IShareAPI, IStorageAPI, PlatformId, DeviceInfo
} from './IPlatform';

class WeChatStorageAPI implements IStorageAPI {
  get(key: string): string | null {
    if (typeof wx !== 'undefined') {
      return wx.getStorageSync(key) || null;
    }
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    if (typeof wx !== 'undefined') {
      wx.setStorageSync(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  remove(key: string): void {
    if (typeof wx !== 'undefined') {
      wx.removeStorageSync(key);
    } else {
      localStorage.removeItem(key);
    }
  }

  clear(): void {
    if (typeof wx !== 'undefined') {
      wx.clearStorageSync();
    } else {
      localStorage.clear();
    }
  }
}

export class WeChatPlatform implements IPlatform {
  private storage: IStorageAPI = new WeChatStorageAPI();

  getPlatformId(): PlatformId { return 'wechat'; }

  getAdAPI(): IAdAPI {
    throw new Error('AdAPI not implemented for WeChat');
  }

  getIAPAPI(): IIAPAPI {
    throw new Error('IAPAPI not implemented for WeChat');
  }

  getAuthAPI(): IAuthAPI {
    throw new Error('AuthAPI not implemented for WeChat');
  }

  getShareAPI(): IShareAPI {
    throw new Error('ShareAPI not implemented for WeChat');
  }

  getStorageAPI(): IStorageAPI {
    return this.storage;
  }

  getDeviceInfo(): DeviceInfo {
    return { platform: 'wechat', osVersion: '', deviceModel: '' };
  }

  async init(): Promise<void> {}
}
```

- [ ] **Step 2: Commit**

```bash
git add assets/scripts/platform/
git commit -m "feat: add platform implementations (App/H5/WeChat)"
```

---

### Task 14: 安装 Vitest 并跑通全部测试

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: 创建 vitest 配置文件**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: 安装 vitest**

```bash
npm install -D vitest
```

- [ ] **Step 3: 运行全部测试**

```bash
npx vitest run
```

预期: 15 个 PASS（EventBus 7 + GameData 9）

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test infrastructure"
```

---

## Plan Self-Review

**1. Spec coverage check:**

| Spec 章节 | 对应 Task |
|-----------|----------|
| 2. 核心模块划分 | Task 1, 12 |
| 3. EventBus + UIManager | Task 2, 7 |
| 4. 资源管理 & 热更 | Task 8, 10 |
| 5. 数据流与存储 | Task 5, 6 |
| 6. 错误处理 | Task 9（NetService 重试）, Task 10（热更失败） |
| 7. 测试策略 | Task 2, 6, 14 |
| IPlatform | Task 3, 13 |

全覆盖，无遗漏。

**2. Placeholder scan:** 无 TBD/TODO/空壳注释（模块空壳中的 TODO 标记的是业务逻辑，属于下阶段实现范围）。

**3. Type consistency:** EventBus 的方法签名在测试和实现中一致；GameData 的接口类型与 SaveData 一致；IPlatform 接口在各平台实现中签名一致。
