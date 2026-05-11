import { describe, it, expect, beforeEach } from 'vitest';
import { GameData } from '../../assets/scripts/core/GameData';

describe('GameData', () => {
  let gd: GameData;

  beforeEach(() => {
    gd = new GameData();
  });

  it('should initialize with default hero data', () => {
    expect(gd.hero.level).toBe(1);
    expect(gd.hero.exp).toBe(0);
  });

  it('should set and get currency', () => {
    gd.setCurrency('gold', 100);
    expect(gd.getCurrency('gold')).toBe(100);
  });

  it('should add currency', () => {
    gd.setCurrency('gold', 100);
    gd.addCurrency('gold', 50);
    expect(gd.getCurrency('gold')).toBe(150);
  });

  it('should check if has enough currency', () => {
    gd.setCurrency('gold', 100);
    expect(gd.hasEnough('gold', 50)).toBe(true);
    expect(gd.hasEnough('gold', 200)).toBe(false);
  });

  it('should spend currency', () => {
    gd.setCurrency('gold', 100);
    expect(gd.spendCurrency('gold', 30)).toBe(true);
    expect(gd.getCurrency('gold')).toBe(70);
  });

  it('should not spend more than available', () => {
    gd.setCurrency('gold', 10);
    expect(gd.spendCurrency('gold', 20)).toBe(false);
    expect(gd.getCurrency('gold')).toBe(10);
  });

  it('should track dirty keys', () => {
    gd.setCurrency('gold', 100);
    expect(gd.isDirty('currencies')).toBe(true);
    gd.clearDirty();
    expect(gd.isDirty('currencies')).toBe(false);
  });

  it('should produce save snapshot', () => {
    gd.hero.level = 5;
    gd.setCurrency('gold', 100);
    const snapshot = gd.toSaveData();
    expect(snapshot.hero.level).toBe(5);
    expect(snapshot.currencies['gold']).toBe(100);
  });

  it('should restore from save data', () => {
    const save = gd.toSaveData();
    save.hero.level = 10;
    gd.fromSaveData(save);
    expect(gd.hero.level).toBe(10);
  });
});
