# 背包模块（BagModule）

## 概述

管理玩家所有道具物品的增删改查，支持按 itemId 订阅数量变化。

## 数据结构

### ItemData

| 字段 | 类型 | 说明 |
|------|------|------|
| uid | `number` | 物品唯一ID（背包格子唯一标识） |
| itemId | `number` | 物品配置ID（对应策划表） |
| count | `number` | 数量 |
| extra | `Record<string, unknown>`（可选） | 额外数据（如装备属性、时效等） |

## API

### 增

- `addItem(itemId: number, count: number, extra?: Record<string, unknown>): ItemData`
  添加物品到背包，返回新创建的物品数据。

### 删

- `removeItem(uid: number, count?: number): boolean`
  移除物品。不传 count 或 count >= 物品数量时完全移除，否则减去相应数量。返回是否成功。

### 改

- `updateItem(uid: number, changes: Partial<Pick<ItemData, 'count' | 'extra'>>): boolean`
  更新物品的数量或额外数据。返回是否成功。

### 查

| 方法 | 说明 |
|------|------|
| `getItem(uid: number): ItemData \| undefined` | 按唯一ID获取物品 |
| `getItems(): ItemData[]` | 获取所有物品 |
| `getItemsByItemId(itemId: number): ItemData[]` | 获取指定配置ID的所有物品 |
| `getItemCount(itemId: number): number` | 获取指定配置ID的物品总数量 |
| `get size(): number` | 背包物品总数（格子数） |

### 钩子

- `onItemCountChange(itemId: number, cb: ItemCountChangeCallback): void`
  监听指定 itemId 的背包总数量变化，注册后立即回调一次当前数量。

- `offItemCountChange(itemId: number, cb: ItemCountChangeCallback): void`
  取消监听。

```typescript
type ItemCountChangeCallback = (itemId: number, count: number) => void;
```

## 事件

| 事件 | 触发时机 | payload |
|------|----------|---------|
| `bag:itemAdded` | 物品添加 | `{ item: ItemData }` |
| `bag:itemRemoved` | 物品完全移除 | `{ uid: number, itemId: number }` |
| `bag:itemUpdated` | 数量/数据变化 | `{ item: ItemData }` |

## 依赖

| 依赖 | 说明 |
|------|------|
| EventBus | 事件通信 |
| ModuleManager | 模块注册 |
| GameData | 未使用 |

## 文件

- `assets/scripts/modules/bag/BagModule.ts`
- `assets/scripts/events/index.ts`（BagEvents）
