import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { IGameModule } from '../../core/IGameModule';
import { EquipEvents } from '../../events';

export class EquipSystem implements IGameModule {
  private static _inst: EquipSystem;
  static get inst(): EquipSystem {
    if (!this._inst) this._inst = new EquipSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

  upgradeEquip(equipId: string): void {
    // TODO: implement upgrade logic
  }

  dismantleEquip(equipId: string): void {
    // TODO: implement dismantle logic
  }
}
