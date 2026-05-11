import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import type { IGameModule } from '../../core/IGameModule';
import type { QuestCondition } from '../../data';
import { QuestEvents } from '../../events';

export class QuestModule implements IGameModule {
  private static _inst: QuestModule;
  static get inst(): QuestModule {
    if (!this._inst) this._inst = new QuestModule();
    return this._inst;
  }

  private bus: EventBus = EventBus.inst;
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
