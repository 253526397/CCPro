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
