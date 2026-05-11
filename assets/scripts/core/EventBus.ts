type EventCallback = (...args: any[]) => void;

interface EventEntry {
  callback: EventCallback;
  target?: object;
}

export class EventBus {
  private events: Map<string, EventEntry[]> = new Map();

  on(event: string, callback: EventCallback, target?: object): void {
    const entries = this.events.get(event) || [];
    entries.push({ callback, target });
    this.events.set(event, entries);
  }

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

  emit(event: string, ...args: any[]): void {
    const entries = this.events.get(event);
    if (!entries) return;

    for (const entry of entries) {
      entry.callback(...args);
    }
  }

  destroy(): void {
    this.events.clear();
  }
}
