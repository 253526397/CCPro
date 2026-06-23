import { EventBus } from '../../core/EventBus';
import type { IGameModule } from '../../core/IGameModule';
import { RedDotData } from './RedDotData';
import { RedDotEvents } from '../../events';

/** 红点显示对象接口 — 视图层实现此接口以响应计数变化 */
export interface IRedDotDisplay {
  updateVisible(visible: boolean): void;
}

/**
 * 红点模块 — 业务层入口。
 * 协调数据层（RedDotData）与视图层（IRedDotDisplay），
 * 外部通过 ModuleManager.get('RedDotModule') 获取实例。
 *
 * @example
 * // 业务代码 — 设置红点计数
 * const reddot = ModuleManager.inst.get<RedDotModule>('RedDotModule');
 * reddot.setCount('home/friends/message', 5);
 *
 * // 视图组件 — 注册/移除显示对象
 * reddot.registerDisplay('home/friends', this);  // onLoad
 * reddot.removeDisplay('home/friends', this);    // onDestroy
 */
export class RedDotModule implements IGameModule {
  private bus: EventBus = EventBus.inst;
  private data: RedDotData = new RedDotData();
  /** path → 已注册的显示对象集合 */
  private displays: Map<string, Set<IRedDotDisplay>> = new Map();

  //#region 生命周期
  onInit(): void {}
  onConfigLoaded(): void {}
  onGameStart(): void {}

  onCleanup(): void {
    this.data.clear();
    this.displays.clear();
  }
  //#endregion

  //#region 显示对象管理（视图层调用）

  /** 为指定路径注册一个显示对象，注册后立即同步当前状态 */
  registerDisplay(path: string, display: IRedDotDisplay): void {
    let set = this.displays.get(path);
    if (!set) {
      set = new Set();
      this.displays.set(path, set);
    }
    set.add(display);

    // 立即同步当前计数状态
    display.updateVisible(this.data.getCount(path) > 0);
  }

  /** 移除指定路径下的显示对象 */
  removeDisplay(path: string, display: IRedDotDisplay): void {
    this.displays.get(path)?.delete(display);
  }
  //#endregion

  //#region 计数操作（业务层调用）

  /** 设置路径的自身计数，变化后自动通知关联的显示对象 */
  setCount(path: string, count: number): void {
    this.data.setCount(path, count);
    this.notifyPathAndAncestors(path);
  }

  /** 增量更新路径计数 */
  addCount(path: string, delta: number): void {
    this.data.addCount(path, delta);
    this.notifyPathAndAncestors(path);
  }

  /** 清零路径计数 */
  clearCount(path: string): void {
    this.data.clearCount(path);
    this.notifyPathAndAncestors(path);
  }

  /** 获取路径的总计数（含子节点聚合） */
  getCount(path: string): number {
    return this.data.getCount(path);
  }
  //#endregion

  //#region 内部通知

  /** 通知 path 自身及其所有祖先节点上注册的显示对象 */
  private notifyPathAndAncestors(path: string): void {
    let current: string | null = path;
    while (current) {
      this.notifyDisplays(current);
      current = this.getParentPath(current);
    }
  }

  private notifyDisplays(path: string): void {
    const count = this.data.getCount(path);
    const set = this.displays.get(path);
    if (set) {
      const visible = count > 0;
      set.forEach(d => d.updateVisible(visible));
    }
    this.bus.emit(RedDotEvents.COUNT_CHANGED, { path, count });
  }

  private getParentPath(path: string): string | null {
    const idx = path.lastIndexOf('/');
    return idx > 0 ? path.substring(0, idx) : null;
  }
  //#endregion
}
