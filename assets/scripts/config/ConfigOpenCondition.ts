// 自动生成于 excel 时间: 2026-06-24T11:01:32.839Z
// 表: ConfigOpenCondition
// 请勿手动编辑此文件

export interface IConfigOpenCondition {
  /** 道具ID */
  id?: number;
  /** 关卡 */
  stage?: number;
  /** 等级 */
  level?: number;
  /** 完成任务ID */
  taskId?: number;
}

export class ConfigOpenCondition {
  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static dataMap: Record<string, IConfigOpenCondition> = {};

  /** 根据 id 查询 */
  public static Get(key: number | string): IConfigOpenCondition | undefined {
    return ConfigOpenCondition.dataMap[String(key)];
  }

  /** 根据字段值查找 */
  public static Find(field: keyof IConfigOpenCondition, value: any): IConfigOpenCondition | undefined {
    for (const k in ConfigOpenCondition.dataMap) {
      if (ConfigOpenCondition.dataMap[k][field] == value) return ConfigOpenCondition.dataMap[k];
    }
    return undefined;
  }
}

/** ConfigOpenCondition 元信息 */
export const ConfigOpenConditionMeta = {
  keyField: 'id',
  fieldNames: ["id","stage","level","taskId"],
};
