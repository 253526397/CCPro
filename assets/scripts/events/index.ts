/** 战斗系统事件 */
export const BattleEvents = {
  /** 战斗开始，payload: { stageId: number } */
  STARTED: 'battle:started',
  /** 战斗结束，payload: { win: boolean, rewards?: Reward[] } */
  FINISHED: 'battle:finished',
  /** 造成伤害，payload: { targetId: number, damage: number } */
  DAMAGE_DEALT: 'battle:damageDealt',
  /** 敌人被击败，payload: { enemyId: number } */
  ENEMY_DEFEATED: 'battle:enemyDefeated',
} as const;

/** 网络相关事件 */
export const NetEvents = {
  /** 网络已连接 */
  CONNECTED: 'net:connected',
  /** 网络断开 */
  DISCONNECTED: 'net:disconnected',
  /** 请求失败，payload: { url: string, error: string } */
  REQUEST_FAILED: 'net:requestFailed',
  /** 云存档保存完成 */
  CLOUD_SAVE_DONE: 'net:cloudSaveDone',
  /** 云存档冲突，需用户选择本地/云端 */
  CONFLICT_DETECTED: 'net:conflictDetected',
} as const;

/** 红点系统事件 */
export const RedDotEvents = {
  /** 红点计数变化，payload: { path: string, count: number } */
  COUNT_CHANGED: 'reddot:countChanged',
} as const;

/** 背包系统事件 */
export const BagEvents = {
  /** 物品增加，payload: { item: ItemData } */
  ITEM_ADDED: 'bag:itemAdded',
  /** 物品移除，payload: { uid: number, itemId: number } */
  ITEM_REMOVED: 'bag:itemRemoved',
  /** 物品更新（数量/数据变化），payload: { item: ItemData } */
  ITEM_UPDATED: 'bag:itemUpdated',
} as const;

/** 全局错误事件 */
export const ErrorEvents = {
  /** 本地存储空间不足 */
  STORAGE_QUOTA_EXCEEDED: 'storage:quotaExceeded',
  /** 热更包校验失败 */
  HOTFIX_VERIFY_FAILED: 'hotfix:verifyFailed',
  /** IAP 补单失败 */
  IAP_RESTORE_FAILED: 'iap:restoreFailed',
  /** 资源加载失败 */
  RESOURCE_LOAD_FAILED: 'resource:loadFailed',
} as const;
