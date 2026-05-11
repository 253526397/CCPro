import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';

export class SkillSystem {
  private static _inst: SkillSystem;
  static get inst(): SkillSystem {
    if (!this._inst) this._inst = new SkillSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;
}
