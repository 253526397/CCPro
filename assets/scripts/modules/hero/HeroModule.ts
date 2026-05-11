import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import type { IGameModule } from '../../core/IGameModule';
import { HeroEvents } from '../../events';

export class HeroModule implements IGameModule {
  private static _inst: HeroModule;
  static get inst(): HeroModule {
    if (!this._inst) this._inst = new HeroModule();
    return this._inst;
  }

  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

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
