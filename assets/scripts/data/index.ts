/** 角色核心属性 */
export interface HeroData {
  level: number;
  exp: number;
  nickname: string;
  avatar: number;
  /** 综合战斗力，由装备属性汇总计算 */
  totalPower: number;
}

/** 装备槽位类型 */
export enum EquipSlot {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  RING = 'ring',
  BOOTS = 'boots',
}

/** 装备品质（从低到高 1-5） */
export enum EquipQuality {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

/** 装备运行时数据 */
export interface EquipData {
  id: string;
  name: string;
  slot: EquipSlot;
  quality: EquipQuality;
  level: number;
  attrs: EquipAttr[];
  /** 是否已装备到角色身上 */
  isEquipped: boolean;
}

/** 单条装备属性 */
export interface EquipAttr {
  type: AttrType;
  value: number;
}

/** 属性类型枚举 */
export enum AttrType {
  ATK = 'atk',
  DEF = 'def',
  HP = 'hp',
  CRIT_RATE = 'critRate',
  CRIT_DMG = 'critDmg',
  SPEED = 'speed',
}

/** 关卡静态配置 */
export interface StageData {
  stageId: number;
  name: string;
  isUnlocked: boolean;
  isPassed: boolean;
  enemies: StageEnemy[];
  rewards: StageReward[];
}

/** 关卡敌人配置 */
export interface StageEnemy {
  id: number;
  name: string;
  hp: number;
  atk: number;
  def: number;
  speed: number;
}

/** 关卡奖励 */
export interface StageReward {
  type: 'gold' | 'equip' | 'exp';
  amount: number;
  equipId?: string;
}

/** 关卡推进进度（存档用） */
export interface StageProgressData {
  currentStageId: number;
  passedStageIds: number[];
}

/** 任务类型 */
export enum QuestType {
  DAILY = 'daily',
  GROWTH = 'growth',
  ACHIEVEMENT = 'achievement',
}

/** 任务完成条件类型 */
export enum QuestCondition {
  OPEN_CHEST = 'openChest',
  WIN_BATTLE = 'winBattle',
  UPGRADE_EQUIP = 'upgradeEquip',
  REACH_STAGE = 'reachStage',
  SPEND_GOLD = 'spendGold',
}

/** 任务静态配置 */
export interface QuestData {
  questId: string;
  type: QuestType;
  condition: QuestCondition;
  targetCount: number;
  rewards: { type: string; amount: number }[];
}

/** 任务推进进度（存档用） */
export interface QuestProgress {
  questId: string;
  currentCount: number;
  completed: boolean;
  /** 已完成且已领取奖励 */
  claimed: boolean;
}

/** 完整存档数据结构 */
export interface SaveData {
  hero: HeroData;
  equips: EquipData[];
  currencies: Record<string, number>;
  stageProgress: StageProgressData;
  questProgress: QuestProgress[];
  settings: GameSettings;
  lastSaveTime: number;
}

/** 玩家设置 */
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoBattleSpeed: number;
}

/** 货币类型 */
export enum CurrencyType {
  GOLD = 'gold',
  DIAMOND = 'diamond',
  CHEST_KEY = 'chestKey',
}
