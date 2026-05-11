import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { IGameModule } from '../../core/IGameModule';
import { QuestCondition } from '../../data';
import { QuestEvents } from '../../events';

export class QuestSystem implements IGameModule {
  private static _inst: QuestSystem;
  static get inst(): QuestSystem {
    if (!this._inst) this._inst = new QuestSystem();
    return this._inst;
  }

  private bus: EventBus = new EventBus();
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}

  updateProgress(condition: QuestCondition, count: number): void {
    this.gd.questProgress
      .filter(q => !q.completed && !q.claimed)
      .forEach(q => {
        q.currentCount += count;
        this.bus.emit(QuestEvents.PROGRESS, q);
        if (q.currentCount >= this.getQuestTarget(q.questId)) {
          q.completed = true;
          this.bus.emit(QuestEvents.COMPLETED, q);
        }
      });
  }

  claimReward(questId: string): void {
    const q = this.gd.questProgress.find(p => p.questId === questId);
    if (!q || !q.completed || q.claimed) return;
    q.claimed = true;
    this.bus.emit(QuestEvents.CLAIMED, { questId });
  }

  private getQuestTarget(questId: string): number {
    return 1;
  }
}
