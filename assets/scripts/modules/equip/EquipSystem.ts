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
