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
