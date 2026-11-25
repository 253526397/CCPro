import { OpenConditionConfig, type IOpenConditionConfig } from '../../config/OpenConditionConfig';
import { type IGameModule } from '../../core/ModuleManager';

/** 条件满足回调，返回是否开启 */
export type ConditionCallback = (id: number, isOpen: boolean) => void;

/**
 * 开放条件模块 — 根据 ConfigOpenCondition 配置判断条件是否满足。
 *
 * 其他模块通过 setStage / setLevel / completeTask 更新运行时数据，
 * 模块自动重新评估所有条件，条件首次满足时触发钩子回调。
 *
 * @example
 * const oc = ModuleManager.inst.get<OpenConditionModule>('OpenConditionModule');
 * oc.setStage(5);                                          // 更新关卡进度
 * oc.onConditionMet(2, (id) => { unlock(id); return true; });  // 注册条件满足钩子
 */
export class OpenConditionModule implements IGameModule {

  /** 当前关卡 */
  private currentStage: number = 0;
  /** 当前等级 */
  private currentLevel: number = 0;
  /** 已完成的任务ID集合 */
  private completedTasks: Set<number> = new Set();

  /** 已满足的条件ID集合 */
  private met: Set<number> = new Set();
  /** id → 条件满足回调集合 */
  private hooks: Map<number, Set<ConditionCallback>> = new Map();

  //#region 生命周期

  onInit(): void {}

  onConfigLoaded(): void {
    this.currentStage = 0;
    this.currentLevel = 0;
    this.completedTasks.clear();
    this.met.clear();
  }

  onUserDataLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {
    this.completedTasks.clear();
    this.met.clear();
    this.hooks.clear();
  }

  //#endregion

  //#region 钩子

  /**
   * 返回 boolean 表示条件是否已满足，已满足时立即回调。
   */
  onConditionMet(id: number, cb: ConditionCallback): void {
    let set = this.hooks.get(id);
    if (!set) {
      set = new Set();
      this.hooks.set(id, set);
    }
    set.add(cb);
    if (this.met.has(id)) {
      cb(id, true);
      return;
    }
    cb(id, false);
  }

  /** 取消监听 */
  offConditionMet(id: number, cb: ConditionCallback): void {
    this.hooks.get(id)?.delete(cb);
  }

  //#endregion

  //#region 数据更新（其他模块调用）

  /** 更新当前关卡，变化后自动重新评估 */
  setStage(stage: number): void {
    if (this.currentStage === stage) return;
    this.currentStage = stage;
    this.evaluateAll();
  }

  /** 更新当前等级，变化后自动重新评估 */
  setLevel(level: number): void {
    if (this.currentLevel === level) return;
    this.currentLevel = level;
    this.evaluateAll();
  }

  /** 完成任务，变化后自动重新评估 */
  completeTask(taskIdList: number[]): void {
    let changed = false;
    for (const taskId of taskIdList) {
      if (!this.completedTasks.has(taskId)) {
        this.completedTasks.add(taskId);
        changed = true;
      }
    }
    if (changed) {
      this.evaluateAll();
    }
  }

  //#endregion

  //#region 查询

  /** 指定 id 的条件是否已满足 */
  isMet(id: number): boolean {
    return this.met.has(id);
  }

  /** 获取当前运行时数据快照 */
  getSnapshot() {
    return {
      stage: this.currentStage,
      level: this.currentLevel,
      completedTasks: new Set(this.completedTasks),
      met: new Set(this.met),
    };
  }

  //#endregion

  //#region 内部评估

  /** 重新评估所有配置条件，满足时触发钩子+事件 */
  private evaluateAll(): void {
    for (const key in OpenConditionConfig.dataMap) {
      const config = OpenConditionConfig.dataMap[key];
      const id = config.id!;
      this.evaluate(id, config);
    }
  }

  /** 评估单个条件 */
  private evaluate(id: number, config: IOpenConditionConfig): void {
    if (this.met.has(id)) return;

    if (this.checkCondition(config)) {
      this.met.add(id);
      this.fireHooks(id, true);
    }
  }

  /** 触发指定 id 的钩子，收集返回值 */
  private fireHooks(id: number, isOpen: boolean): void {
    this.hooks.get(id)?.forEach(cb => { cb(id, isOpen) });
  }

  /** 检查单条配置是否满足 */
  private checkCondition(config: IOpenConditionConfig): boolean {
    if (config.stage !== undefined && this.currentStage < config.stage) return false;
    if (config.level !== undefined && this.currentLevel < config.level) return false;
    if (config.taskId !== undefined && !this.completedTasks.has(config.taskId)) return false;
    return true;
  }

  //#endregion
}