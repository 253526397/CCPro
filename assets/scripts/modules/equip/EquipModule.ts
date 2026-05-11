import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import type { IGameModule } from '../../core/IGameModule';
import { EquipEvents } from '../../events';

export class EquipModule implements IGameModule {
  private bus: EventBus = EventBus.inst;
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
