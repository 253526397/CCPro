/** 箱子系统事件 */
export const ChestEvents = {
  /** 箱子已打开，payload: { rewards: RewardItem[] } */
  OPENED: 'chest:opened',
  /** 获得装备，payload: { equip: EquipData } */
  EQUIP_OBTAINED: 'chest:equipObtained',
} as const;

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

/** 装备系统事件 */
export const EquipEvents = {
  /** 装备强化成功 */
  UPGRADED: 'equip:upgraded',
  /** 装备分解 */
  DISMANTLED: 'equip:dismantled',
  /** 装备升品成功 */
  QUALITY_UP: 'equip:qualityUp',
  /** 装备已穿上 */
  EQUIPPED: 'equip:equipped',
  /** 装备已卸下 */
  UNEQUIPPED: 'equip:unequipped',
} as const;

/** 角色/英雄系统事件 */
export const HeroEvents = {
  /** 角色升级，payload: { level: number } */
  LEVEL_UP: 'hero:levelUp',
  /** 角色属性变化 */
  ATTR_CHANGED: 'hero:attrChanged',
  /** 装备变更（穿/卸） */
  EQUIP_CHANGED: 'hero:equipChanged',
  /** 战斗力变化，payload: { power: number } */
  POWER_CHANGED: 'hero:powerChanged',
} as const;

/** 关卡系统事件 */
export const StageEvents = {
  /** 关卡通关，payload: { stageId: number } */
  PASSED: 'stage:passed',
  /** 领取关卡奖励 */
  REWARDED: 'stage:rewarded',
  /** 新关卡解锁 */
  UNLOCKED: 'stage:unlocked',
} as const;

/** 商城 & 货币系统事件 */
export const ShopEvents = {
  /** 购买成功，payload: { itemId: string, currency: string, cost: number } */
  PURCHASED: 'shop:purchased',
  /** 货币数量变化，payload: { type: string, amount: number } */
  CURRENCY_CHANGED: 'currency:changed',
} as const;

/** 任务系统事件 */
export const QuestEvents = {
  /** 任务进度更新，payload: QuestProgress */
  PROGRESS: 'quest:progress',
  /** 任务完成，payload: QuestProgress */
  COMPLETED: 'quest:completed',
  /** 奖励已领取，payload: { questId: string } */
  CLAIMED: 'quest:claimed',
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
