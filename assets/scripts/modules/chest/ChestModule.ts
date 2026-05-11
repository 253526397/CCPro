import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { IGameModule } from '../../core/IGameModule';
import { ChestEvents } from '../../events';

export class ChestModule implements IGameModule {
  private static _inst: ChestModule;
  static get inst(): ChestModule {
    if (!this._inst) this._inst = new ChestModule();
    return this._inst;
  }

  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

  openChest(type: string): void {
    // TODO: implement chest opening logic
  }
}
