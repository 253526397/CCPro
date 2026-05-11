# 游戏架构设计

**项目**: NewProject（类似疯狂骑士团）
**引擎**: Cocos Creator 3.8.8
**日期**: 2026-05-11

---

## 1. 需求摘要

| 维度 | 决策 |
|------|------|
| 核心玩法 | 开箱子 + 自动战斗 + 装备养成 |
| 目标平台 | 移动 App + H5 + 微信/抖音小游戏 |
| 网络模式 | 弱联网（云存档、排行榜，无实时对战） |
| 资源策略 | 本地基础包 + CDN 远程资源包，支持热更 |
| 变现模式 | IAP 内购 + 激励视频广告混合 |
| 架构选型 | 方案 B — 模块化 + 事件驱动 |

---

## 2. 核心模块划分

```
Game Entry
├── ChestSystem      箱子系统（开箱、掉落、动画）
├── BattleSystem     战斗系统（自动战斗状态机、伤害计算）
├── EquipSystem      装备系统（生成、强化、升品、套装）
├── HeroSystem       角色/属性系统（属性汇总、等级）
├── StageSystem      关卡系统（配置、进度、奖励）
├── ShopSystem       商城系统（商品、货币、月卡）
├── QuestSystem      任务系统（每日/成长/成就）
├── SkillSystem      技能/天赋系统
└── 基础设施层
    ├── EventBus      全局事件发布/订阅
    ├── UIManager     UI 注册、查找、层级管理
    ├── NetService    HTTP 短连接
    ├── IPlatform     平台差异封装（广告、支付、登录、分享、存储）
    ├── ResMgr        资源加载与热更管理
    ├── HotfixManager 远程资源版本检测与增量更新
    └── ConfigService 策划配置表加载与查询
```

### IPlatform 接口

```
IPlatform
├── getAdAPI()        激励视频、插屏
├── getIAPAPI()       内购商品、下单、回调
├── getAuthAPI()      账号登录/登出
├── getShareAPI()     分享
├── getStorageAPI()   本地存储
├── getDeviceInfo()   设备信息
└── getPlatformId()   App / H5 / WeChat / Douyin
```

不同平台各自实现 IPlatform，业务模块只依赖接口。

---

## 3. EventBus + UIManager 通信设计

### 事件命名规范

格式: `模块:动作`，定义在 `events/` 目录下。

```
events/
├── chest-events.ts    // "chest:opened"
├── battle-events.ts   // "battle:started" "battle:finished"
├── equip-events.ts    // "equip:upgraded"
├── hero-events.ts     // "hero:levelUp"
├── stage-events.ts    // "stage:passed"
├── shop-events.ts     // "shop:purchased"
├── quest-events.ts    // "quest:completed"
├── net-events.ts      // "net:disconnected"
└── error-events.ts    // "storage:quotaExceeded"
```

### 通信边界

| 场景 | 方式 |
|------|------|
| 跨业务模块通信 | EventBus |
| 基础设施调用 | 直接 import |
| 同一模块内部 | 直接方法调用 |
| UI 层获取 UI 实例 | UIManager.get() |

- 禁止跨模块直接 import 业务类
- 每个事件声明 payload 类型

### UIManager

- UI 层级: Loading > Tips > Float > Dialog > HUD > Scene > Background
- 业务模块通过 `UIManager.inst.open("ChestResultDialog")` 获取 UI
- UI 层只读数据，不直接写 GameData

---

## 4. 资源管理 & 热更

### 目录结构（混合方案）

```
assets/
├── res/
│   ├── modules/
│   │   ├── chest/   {ui, spine, audio}
│   │   ├── battle/  {ui, prefab}
│   │   └── shop/    {ui}
│   ├── common/
│   │   ├── ui/      通用按钮、弹窗框、loading
│   │   ├── spine/   通用特效
│   │   └── audio/   通用音效
│   └── config/      策划配置
├── scripts/
│   ├── core/        基础设施
│   ├── modules/     业务模块
│   ├── platform/    IPlatform + 平台实现
│   ├── events/      事件定义
│   └── GameEntry.ts
└── scenes/
    └── Main.scene   唯一场景
```

### 启动流程

```
Main.scene 加载
  → ConfigService.load()
  → UIManager.init(layers)
  → IPlatform.init()
  → ResMgr.checkHotfix()
       ├── 有更新 → 下载远程 bundle → 应用
       └── 无更新 → 跳过
  → EventBus.emit("game:ready")
```

### 加载原则

- 业务模块统一走 ResMgr 加载，不区分本地/远程
- 远程 bundle 优先级高于本地 bundle
- 热更资源覆盖本地同名资源

---

## 5. 数据流与存储

### 数据分层

```
UI (只读) → GameData ← (写) 业务模块
                ↓
           Storage API (IPlatform → 本地 / NetService → 云端)
```

### GameData

单一数据根，持有所有运行时状态：hero, inventory, equips, currencies, stageProgress, questProgress, settings。

- 脏标记机制，避免频繁全量存盘
- 修改数据后自动 emit 对应事件通知 UI 刷新

### 存储策略

| 数据类型 | 存储位置 | 频率 |
|----------|---------|------|
| 货币、装备、背包 | 本地主存 + 云端备份 | 关键操作后立即 |
| 关卡进度 | 本地主存 + 云端备份 | 过关后 |
| 设置 | 仅本地 | 即时 |
| 临时战斗状态 | 仅内存 | 不持久化 |
| 排行榜 | 仅服务端 | 按需拉取 |

---

## 6. 错误处理

三层错误处理:

- **UI 层**: Toast/Dialog 提示，网络失败显示重试按钮
- **业务模块层**: 捕获 + emit 错误事件，降级逻辑（本地数据兜底）
- **基础设施层**: 网络超时重试 3 次，资源加载失败回退本地 bundle

关键场景: 资源下载失败回退、云存档冲突提示选择、IAP 丢单本地补单队列。

---

## 7. 测试策略

| 层 | 范围 | 工具 |
|----|------|------|
| 单元测试 | 纯逻辑（算法、公式、EventBus、GameData） | Jest/Vitest |
| 集成测试 | 多模块协作（可选） | Cocos 编辑器内 |
| E2E | 完整流程 | 手动验收 + 真机 |

- 核心算法必须有单测: 抽奖概率、伤害公式、强化公式
- 配置以纯 TS 常量导出，不依赖引擎加载
- UI/动画/SDK 交互靠手动验收

---

## 8. 目录结构总览

```
NewProject/
├── assets/
│   ├── res/
│   │   ├── modules/{chest,battle,shop,...}/
│   │   ├── common/{ui,spine,audio}/
│   │   └── config/
│   ├── scripts/
│   │   ├── core/          EventBus, UIManager, GameData, ResMgr, ...
│   │   ├── modules/       {chest,battle,equip,hero,stage,shop,quest,skill}/
│   │   ├── platform/      IPlatform, AppPlatform, WeChatPlatform, ...
│   │   ├── events/        事件定义
│   │   └── GameEntry.ts
│   └── scenes/
│       └── Main.scene
├── tests/
│   ├── modules/           {chest,battle,equip,...}.test.ts
│   └── core/              {eventbus,gamedata,...}.test.ts
├── docs/
│   └── superpowers/
│       └── specs/
└── settings/
```

### 约束规则

1. 业务模块之间只能通过 EventBus 通信
2. 业务模块不直接 import UI 类，通过 UIManager 获取
3. UI 层只读 GameData，不直接修改
4. 所有平台差异收敛到 IPlatform 实现
5. 配置以纯 TS 常量导出，支持单元测试
6. 模块资源就近放在 `res/modules/<module>/` 下
