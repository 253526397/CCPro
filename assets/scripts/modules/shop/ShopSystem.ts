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
    this.bus.emit(ShopEvents.PURCHASED, { itemId, currency: 'gold', cost });
    return true;
  }

  buyWithDiamond(itemId: string, cost: number): boolean {
    if (!this.gd.spendCurrency('diamond', cost)) return false;
    this.bus.emit(ShopEvents.PURCHASED, { itemId, currency: 'diamond', cost });
    return true;
  }
}
