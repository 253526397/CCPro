export const ChestEvents = {
  OPENED: 'chest:opened',
  EQUIP_OBTAINED: 'chest:equipObtained',
} as const;

export const BattleEvents = {
  STARTED: 'battle:started',
  FINISHED: 'battle:finished',
  DAMAGE_DEALT: 'battle:damageDealt',
  ENEMY_DEFEATED: 'battle:enemyDefeated',
} as const;

export const EquipEvents = {
  UPGRADED: 'equip:upgraded',
  DISMANTLED: 'equip:dismantled',
  QUALITY_UP: 'equip:qualityUp',
  EQUIPPED: 'equip:equipped',
  UNEQUIPPED: 'equip:unequipped',
} as const;

export const HeroEvents = {
  LEVEL_UP: 'hero:levelUp',
  ATTR_CHANGED: 'hero:attrChanged',
  EQUIP_CHANGED: 'hero:equipChanged',
  POWER_CHANGED: 'hero:powerChanged',
} as const;

export const StageEvents = {
  PASSED: 'stage:passed',
  REWARDED: 'stage:rewarded',
  UNLOCKED: 'stage:unlocked',
} as const;

export const ShopEvents = {
  PURCHASED: 'shop:purchased',
  CURRENCY_CHANGED: 'currency:changed',
} as const;

export const QuestEvents = {
  PROGRESS: 'quest:progress',
  COMPLETED: 'quest:completed',
  CLAIMED: 'quest:claimed',
} as const;

export const NetEvents = {
  CONNECTED: 'net:connected',
  DISCONNECTED: 'net:disconnected',
  REQUEST_FAILED: 'net:requestFailed',
  CLOUD_SAVE_DONE: 'net:cloudSaveDone',
  CONFLICT_DETECTED: 'net:conflictDetected',
} as const;

export const ErrorEvents = {
  STORAGE_QUOTA_EXCEEDED: 'storage:quotaExceeded',
  HOTFIX_VERIFY_FAILED: 'hotfix:verifyFailed',
  IAP_RESTORE_FAILED: 'iap:restoreFailed',
  RESOURCE_LOAD_FAILED: 'resource:loadFailed',
} as const;
