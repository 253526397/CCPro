// 自动生成于 excel 时间: 2026-06-24T11:01:32.824Z
// 表: ConfigItem
// 请勿手动编辑此文件
import { ItemType } from './ConfigEnums';

export interface IConfigItem {
  /** 道具ID */
  id?: number;
  /** 道具名称 */
  name?: string;
  /** 类型 */
  type?: ItemType;
  /** 价格 */
  price?: number;
  /** 可堆叠 */
  stackable?: boolean;
  /** 属性 */
  attributes?: Record<string, unknown>;
}

export class ConfigItem {
  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static dataMap: Record<string, IConfigItem> = {};

  /** 根据 id 查询 */
  public static Get(key: number | string): IConfigItem | undefined {
    return ConfigItem.dataMap[String(key)];
  }

  /** 根据字段值查找 */
  public static Find(field: keyof IConfigItem, value: any): IConfigItem | undefined {
    for (const k in ConfigItem.dataMap) {
      if (ConfigItem.dataMap[k][field] == value) return ConfigItem.dataMap[k];
    }
    return undefined;
  }
}

/** ConfigItem 元信息 */
export const ConfigItemMeta = {
  keyField: 'id',
  fieldNames: ["id","name","type","price","stackable","attributes"],
};
