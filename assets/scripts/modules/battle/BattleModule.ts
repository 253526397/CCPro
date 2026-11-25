import EventManager from '../../core/EventManager';
import { GameData } from '../../core/GameData';
import { type IGameModule } from '../../core/ModuleManager';
import { BattleEvents } from '../../events/EventConst';

export enum BattleState {
  IDLE = 'idle',
  FIGHTING = 'fighting',
  FINISHED = 'finished',
}

export class BattleModule implements IGameModule {
  private gd: GameData = GameData.inst;
  state: BattleState = BattleState.IDLE;

  onInit(): void {}

  onConfigLoaded(): void {}

  onUserDataLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

  start(stageId: number): void {
    this.state = BattleState.FIGHTING;
    EventManager.emit(BattleEvents.STARTED, stageId);
  }

  finish(win: boolean): void {
    this.state = BattleState.FINISHED;
    EventManager.emit(BattleEvents.FINISHED, win);
  }
}