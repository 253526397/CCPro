import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import type { IGameModule } from '../../core/IGameModule';

export class SkillModule implements IGameModule {
  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}
}
