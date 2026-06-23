---
name: create-module
description: 创建一个新的业务模块（Module）。自动生成模块目录、Module.ts 文件，并可选地在 events/index.ts 中注册事件。
---

# 创建模块 Skill

当用户说"帮我创建一个XXX模块"、"新建一个XXX系统"时，按以下步骤自动创建模块。

> 注意：`.meta` 文件由 Cocos Creator 统一管理，无需手动创建。

## 步骤

### 1. 确认模块名称

从用户输入中提取模块名称，例如：
- "帮我创建一个商店模块" → Shop
- "新建一个邮件系统" → Mail
- "创建一个公会模块" → Guild

转换为 PascalCase：首字母大写，英文单词。如果用户用中文表达，翻译为对应的英文 PascalCase 名称。

在开始前，简要告知用户你即将创建的模块名称和路径，获得确认。

### 2. 检查是否已存在

检查 `assets/scripts/modules/<lowercase-name>/` 目录是否已存在。如果已存在，告知用户并停止。

### 3. 创建模块目录

创建目录 `assets/scripts/modules/<lowercase-name>/`。

### 4. 创建 Module.ts 文件

文件路径：`assets/scripts/modules/<lowercase-name>/<Name>Module.ts`

使用以下模板：

```typescript
import { EventBus } from '../../core/EventBus';
import { GameData } from '../../core/GameData';
import { ModuleManager, type IGameModule } from '../../core/ModuleManager';
import { <Name>Events } from '../../events';

export class <Name>Module implements IGameModule {
  private bus: EventBus = EventBus.inst;
  private gd: GameData = GameData.inst;

  onInit(): void {}

  onConfigLoaded(): void {}

  onGameStart(): void {}

  onCleanup(): void {}
}

export const <camelName>Module = ModuleManager.inst.register<<Name>Module>('<Name>Module', <Name>Module);
```

要点：
- `<Name>` 替换为 PascalCase 模块名（如 `Shop`, `Mail`, `Guild`）
- `<camelName>` 替换为 camelCase 模块名（如 `shop`, `mail`, `guild`）
- `GameData` 的 import 可选，如果模块不需要策划配置数据可省略
- 如果模块不需要在 `events/index.ts` 中定义事件，去掉 `import { <Name>Events }` 这一行
- 如果模块有状态枚举，在 class 上方添加 `export enum <Name>State { ... }`
- 在 class 中按需添加私有属性（如 `state`, `data` 等）和业务方法

### 5. 可选：在 events/index.ts 中注册事件

如果用户明确要求该模块需要事件，或模块功能明显需要事件通信（如跨模块通知），在 `assets/scripts/events/index.ts` 中添加事件常量。

格式参考现有事件：
```typescript
/** <中文描述> */
export const <Name>Events = {
  /** <事件描述>，payload: { ... } */
  <EVENT_NAME>: '<namespace>:<eventName>',
} as const;
```

### 6. 验证

创建完成后，列出所有新建/修改的文件，并确认模块结构正确。

## 注意事项

- 模块通过 `ModuleManager.inst.register` 注册后，其他模块即可通过 `ModuleManager.inst.get<<Name>Module>('<Name>Module')` 安全获取
- 无需在 `GameEntry.ts` 中手动 import — 模块的 `export const <name>Module = ...` 行会在文件被 import 时自动执行注册
- 保持代码风格与现有模块（BattleModule、RedDotModule）一致
- `.meta` 文件交给 Cocos Creator 自动生成，本 skill 不处理
