import { describe, it, expect, beforeEach } from 'vitest';
import { EventBus } from '../../assets/scripts/core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should register and trigger an event', () => {
    let called = false;
    bus.on('test:event', () => { called = true; });
    bus.emit('test:event');
    expect(called).toBe(true);
  });

  it('should pass arguments to callback', () => {
    let received: any = null;
    bus.on('test:data', (data: any) => { received = data; });
    bus.emit('test:data', { value: 42 });
    expect(received).toEqual({ value: 42 });
  });

  it('should support multiple subscribers for same event', () => {
    let count = 0;
    bus.on('test:multi', () => { count++; });
    bus.on('test:multi', () => { count++; });
    bus.emit('test:multi');
    expect(count).toBe(2);
  });

  it('should unregister a specific callback', () => {
    let count = 0;
    const cb = () => { count++; };
    bus.on('test:event', cb);
    bus.off('test:event', cb);
    bus.emit('test:event');
    expect(count).toBe(0);
  });

  it('should unregister all callbacks when target is provided', () => {
    const obj = {};
    let count = 0;
    bus.on('test:event', () => { count++; }, obj);
    bus.on('test:event', () => { count++; }, obj);
    bus.off('test:event', undefined, obj);
    bus.emit('test:event');
    expect(count).toBe(0);
  });

  it('should do nothing when emitting non-existent event', () => {
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('should handle multiple arguments', () => {
    let a = 0, b = '';
    bus.on('test:multiArg', (n: number, s: string) => { a = n; b = s; });
    bus.emit('test:multiArg', 1, 'hello');
    expect(a).toBe(1);
    expect(b).toBe('hello');
  });
});
