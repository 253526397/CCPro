import { EventBus } from '../../core/EventBus';
import { ModuleManager, type IGameModule } from '../../core/ModuleManager';
import { BagEvents } from '../../events';

/** 物品数量变化回调 */
export type ItemCountChangeCallback = (itemId: number, count: number) => void;

/** 物品数据 */
export interface ItemData {
  /** 物品唯一ID（背包格子唯一标识） */
  uid: number;
  /** 物品配置ID（对应策划表） */
  itemId: number;
  /** 数量 */
  count: number;
  /** 额外数据（如装备属性、时效等） */
  extra?: Record<string, unknown>;
}

/**
 * 背包模块 — 管理玩家所有道具物品的增删改查。
 *
 * @example
 * const bag = ModuleManager.inst.get<BagModule>('BagModule');
 * bag.addItem(1001, 5);                          // 添加5个ID为1001的物品
 * bag.removeItem(1);                              // 移除uid=1的物品
 * bag.updateItem(1, { count: 10 });               // 更新数量
 * const item = bag.getItem(1);                    // 按uid查询
 * const total = bag.getItemCount(1001);           // 查询某物品总数
 */
export class BagModule implements IGameModule {
  private bus: EventBus = EventBus.inst;

  /** uid → ItemData */
  private items: Map<number, ItemData> = new Map();
  private nextUid: number = 1;

  /** itemId → 数量变化回调集合 */
  private countHooks: Map<number, Set<ItemCountChangeCallback>> = new Map();

  //#region 生命周期

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {
    this.items.clear();
    this.countHooks.clear();
    this.nextUid = 1;
  }

  //#endregion

  //#region 钩子

  /**
   * 监听指定 itemId 的背包总数量变化。
   * 注册后立即回调一次当前数量。
   */
  onItemCountChange(itemId: number, cb: ItemCountChangeCallback): void {
    let set = this.countHooks.get(itemId);
    if (!set) {
      set = new Set();
      this.countHooks.set(itemId, set);
    }
    set.add(cb);
    // 立即同步当前数量
    cb(itemId, this.getItemCount(itemId));
  }

  /** 取消监听 */
  offItemCountChange(itemId: number, cb: ItemCountChangeCallback): void {
    this.countHooks.get(itemId)?.delete(cb);
  }

  /** 通知指定 itemId 的所有钩子 */
  private notifyCountChange(itemId: number): void {
    const count = this.getItemCount(itemId);
    this.countHooks.get(itemId)?.forEach(cb => cb(itemId, count));
  }

  //#endregion

  //#region 增

  /**
   * 添加物品到背包。
   * @returns 新创建的物品数据
   */
  addItem(itemId: number, count: number, extra?: Record<string, unknown>): ItemData {
    const item: ItemData = { uid: this.nextUid++, itemId, count };
    if (extra) {
      item.extra = extra;
    }
    this.items.set(item.uid, item);
    this.bus.emit(BagEvents.ITEM_ADDED, { item });
    this.notifyCountChange(itemId);
    return item;
  }

  //#endregion

  //#region 删

  /**
   * 移除物品（可部分移除）。
   * 不传 count 或 count >= 物品数量时完全移除；否则减去相应数量。
   * @returns 是否成功移除（uid 不存在返回 false）
   */
  removeItem(uid: number, count?: number): boolean {
    const item = this.items.get(uid);
    if (!item) return false;

    const { itemId } = item;
    if (count === undefined || count >= item.count) {
      // 完全移除
      this.items.delete(uid);
      this.bus.emit(BagEvents.ITEM_REMOVED, { uid, itemId });
    } else {
      // 部分移除
      item.count -= count;
      this.bus.emit(BagEvents.ITEM_UPDATED, { item });
    }
    this.notifyCountChange(itemId);
    return true;
  }

  //#endregion

  //#region 改

  /**
   * 更新物品的数量或额外数据。
   * @returns 是否成功更新
   */
  updateItem(uid: number, changes: Partial<Pick<ItemData, 'count' | 'extra'>>): boolean {
    const item = this.items.get(uid);
    if (!item) return false;

    if (changes.count !== undefined) {
      item.count = changes.count;
    }
    if (changes.extra !== undefined) {
      item.extra = changes.extra;
    }
    this.bus.emit(BagEvents.ITEM_UPDATED, { item });
    this.notifyCountChange(item.itemId);
    return true;
  }

  //#endregion

  //#region 查

  /** 按唯一ID获取物品 */
  getItem(uid: number): ItemData | undefined {
    return this.items.get(uid);
  }

  /** 获取所有物品 */
  getItems(): ItemData[] {
    return [...this.items.values()];
  }

  /** 获取指定配置ID的所有物品 */
  getItemsByItemId(itemId: number): ItemData[] {
    return this.getItems().filter(item => item.itemId === itemId);
  }

  /** 获取指定配置ID的物品总数量 */
  getItemCount(itemId: number): number {
    return this.getItemsByItemId(itemId).reduce((sum, item) => sum + item.count, 0);
  }

  /** 背包物品总数（格子数） */
  get size(): number {
    return this.items.size;
  }

  //#endregion
}

export const bagModule = ModuleManager.inst.register<BagModule>('BagModule', BagModule);
