import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import type { IGameModule } from '../../core/IGameModule';

export class SkillModule implements IGameModule {
  private static _inst: SkillModule;
  static get inst(): SkillModule {
    if (!this._inst) this._inst = new SkillModule();
    return this._inst;
  }

  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}
}
