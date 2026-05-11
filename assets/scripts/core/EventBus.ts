type EventCallback = (...args: any[]) => void;

interface EventEntry {
  callback: EventCallback;
  target?: object;
}

/**
 * 全局事件总线，业务模块之间的唯一通信通道。
 * 禁止跨模块直接 import 业务类，所有跨模块通信通过 EventBus 完成。
 *
 * @example
 * bus.on('chest:opened', (data) => { ... });
 * bus.emit('chest:opened', { rewards });
 */
export class EventBus {
  private events: Map<string, EventEntry[]> = new Map();

  /** 注册事件监听 */
  on(event: string, callback: EventCallback, target?: object): void {
    const entries = this.events.get(event) || [];
    entries.push({ callback, target });
    this.events.set(event, entries);
  }

  /**
   * 取消事件监听。
   * - 传入 callback 取消指定回调
   * - 传入 target 取消该对象的所有回调
   * - 都不传则取消该事件的所有监听
   */
  off(event: string, callback?: EventCallback, target?: object): void {
    if (!this.events.has(event)) return;

    const entries = this.events.get(event)!;

    if (!callback && !target) {
      this.events.delete(event);
      return;
    }

    const filtered = entries.filter(entry => {
      if (target && entry.target !== target) return true;
      if (callback && entry.callback !== callback) return true;
      return false;
    });

    this.events.set(event, filtered);
  }

  /** 触发事件，可传递任意参数 */
  emit(event: string, ...args: any[]): void {
    const entries = this.events.get(event);
    if (!entries) return;

    for (const entry of entries) {
      entry.callback(...args);
    }
  }

  /** 清空所有事件监听 */
  destroy(): void {
    this.events.clear();
  }
}
