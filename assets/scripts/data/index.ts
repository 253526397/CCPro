export interface HeroData {
  level: number;
  exp: number;
  nickname: string;
  avatar: number;
  totalPower: number;
}

export enum EquipSlot {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  HELMET = 'helmet',
  RING = 'ring',
  BOOTS = 'boots',
}

export enum EquipQuality {
  COMMON = 1,
  UNCOMMON = 2,
  RARE = 3,
  EPIC = 4,
  LEGENDARY = 5,
}

export interface EquipData {
  id: string;
  name: string;
  slot: EquipSlot;
  quality: EquipQuality;
  level: number;
  attrs: EquipAttr[];
  isEquipped: boolean;
}

export interface EquipAttr {
  type: AttrType;
  value: number;
}

export enum AttrType {
  ATK = 'atk',
  DEF = 'def',
  HP = 'hp',
  CRIT_RATE = 'critRate',
  CRIT_DMG = 'critDmg',
  SPEED = 'speed',
}

export interface StageData {
  stageId: number;
  name: string;
  isUnlocked: boolean;
  isPassed: boolean;
  enemies: StageEnemy[];
  rewards: StageReward[];
}

export interface StageEnemy {
  id: number;
  name: string;
  hp: number;
  atk: number;
  def: number;
  speed: number;
}

export interface StageReward {
  type: 'gold' | 'equip' | 'exp';
  amount: number;
  equipId?: string;
}

export interface StageProgressData {
  currentStageId: number;
  passedStageIds: number[];
}

export enum QuestType {
  DAILY = 'daily',
  GROWTH = 'growth',
  ACHIEVEMENT = 'achievement',
}

export enum QuestCondition {
  OPEN_CHEST = 'openChest',
  WIN_BATTLE = 'winBattle',
  UPGRADE_EQUIP = 'upgradeEquip',
  REACH_STAGE = 'reachStage',
  SPEND_GOLD = 'spendGold',
}

export interface QuestData {
  questId: string;
  type: QuestType;
  condition: QuestCondition;
  targetCount: number;
  rewards: { type: string; amount: number }[];
}

export interface QuestProgress {
  questId: string;
  currentCount: number;
  completed: boolean;
  claimed: boolean;
}

export interface SaveData {
  hero: HeroData;
  equips: EquipData[];
  currencies: Record<string, number>;
  stageProgress: StageProgressData;
  questProgress: QuestProgress[];
  settings: GameSettings;
  lastSaveTime: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoBattleSpeed: number;
}

export enum CurrencyType {
  GOLD = 'gold',
  DIAMOND = 'diamond',
  CHEST_KEY = 'chestKey',
}
