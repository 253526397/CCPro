import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { BattleEvents } from '../../events';

export enum BattleState {
  IDLE = 'idle',
  FIGHTING = 'fighting',
  FINISHED = 'finished',
}

export class BattleSystem {
  private static _inst: BattleSystem;
  static get inst(): BattleSystem {
    if (!this._inst) this._inst = new BattleSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;
  state: BattleState = BattleState.IDLE;

  start(stageId: number): void {
    this.state = BattleState.FIGHTING;
    this.bus.emit(BattleEvents.STARTED, { stageId });
  }

  finish(win: boolean): void {
    this.state = BattleState.FINISHED;
    this.bus.emit(BattleEvents.FINISHED, { win });
  }
}
