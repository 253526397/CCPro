import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { IGameModule } from '../../core/IGameModule';
import { StageEvents } from '../../events';

export class StageSystem implements IGameModule {
  private static _inst: StageSystem;
  static get inst(): StageSystem {
    if (!this._inst) this._inst = new StageSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

  passStage(stageId: number): void {
    if (!this.gd.stageProgress.passedStageIds.includes(stageId)) {
      this.gd.stageProgress.passedStageIds.push(stageId);
    }
    this.gd.stageProgress.currentStageId = stageId + 1;
    this.bus.emit(StageEvents.PASSED, { stageId });
  }

  unlockStage(stageId: number): void {
    this.bus.emit(StageEvents.UNLOCKED, { stageId });
  }
}
