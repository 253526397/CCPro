# 开放条件模块（OpenConditionModule）

## 概述

根据 `ConfigOpenCondition` 配置表判断条件是否满足。其他模块通过 `setStage` / `setLevel` / `completeTask` 更新运行时数据，模块自动重新评估所有条件。条件首次满足时触发钩子回调，key 为 `IConfigOpenCondition` 中的 `id`。

## 配置关联

- 配置表：`ConfigOpenCondition`（`config/ConfigOpenCondition.ts`）
- 数据由 `Config.parseData()` 加载到 `ConfigOpenCondition.dataMap`

### IConfigOpenCondition

| 字段 | 类型 | 说明 |
|------|------|------|
| id | `number` | 条件ID（主键） |
| stage | `number`（可选） | 所需关卡 |
| level | `number`（可选） | 所需等级 |
| taskId | `number`（可选） | 需完成的任务ID |

满足规则：所有非空字段均满足才判定通过（stage >= 配置.stage **且** level >= 配置.level **且** taskId 已完成）。

## API

### 数据更新（其他模块调用）

| 方法 | 说明 |
|------|------|
| `setStage(stage: number): void` | 更新当前关卡，变化后自动评估 |
| `setLevel(level: number): void` | 更新当前等级，变化后自动评估 |
| `completeTask(taskId: number): void` | 完成一个任务，变化后自动评估 |

### 钩子

- `onConditionMet(id: number, cb: ConditionCallback): void`
  监听指定 id 的条件是否满足。注册时如果条件已满足，立即回调一次。

- `offConditionMet(id: number, cb: ConditionCallback): void`
  取消监听。

```typescript
type ConditionCallback = (id: number) => void;
```

### 查询

| 方法 | 说明 |
|------|------|
| `isMet(id: number): boolean` | 指定 id 的条件是否已满足 |
| `getSnapshot(): RuntimeSnapshot` | 获取当前运行时数据快照 |

## 事件

| 事件 | 触发时机 | payload |
|------|----------|---------|
| `openCondition:conditionMet` | 条件首次满足 | `{ id: number }` |
| `openCondition:stageChanged` | 关卡变化 | `{ stage: number }` |
| `openCondition:levelChanged` | 等级变化 | `{ level: number }` |
| `openCondition:taskCompleted` | 任务完成 | `{ taskId: number }` |

## 依赖

| 依赖 | 说明 |
|------|------|
| EventBus | 事件通信 |
| ModuleManager | 模块注册 |
| ConfigOpenCondition | 条件配置数据 |
| GameData | 未使用 |

## 文件

- `assets/scripts/modules/opencondition/OpenConditionModule.ts`
- `assets/scripts/events/index.ts`（OpenConditionEvents）
