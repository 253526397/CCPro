import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { IGameModule } from '../../core/IGameModule';

export class SkillSystem implements IGameModule {
  private static _inst: SkillSystem;
  static get inst(): SkillSystem {
    if (!this._inst) this._inst = new SkillSystem();
    return this._inst;
  }

  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}
}
