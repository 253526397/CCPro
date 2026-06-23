import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { ModuleManager, type IGameModule } from '../../core/ModuleManager';
import { BattleEvents } from '../../events';

export enum BattleState {
  IDLE = 'idle',
  FIGHTING = 'fighting',
  FINISHED = 'finished',
}

export class BattleModule implements IGameModule {
  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;
  state: BattleState = BattleState.IDLE;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

  start(stageId: number): void {
    this.state = BattleState.FIGHTING;
    this.bus.emit(BattleEvents.STARTED, { stageId });
  }

  finish(win: boolean): void {
    this.state = BattleState.FINISHED;
    this.bus.emit(BattleEvents.FINISHED, { win });
  }
}

export const battleModule = ModuleManager.inst.register<BattleModule>("BattleModule", BattleModule);
