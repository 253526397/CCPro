// 自动生成于 excel 时间: 2026-07-07T08:02:55.534Z
// 表: OpenConditionConfig
// 请勿手动编辑此文件

export interface IOpenConditionConfig {
  /** 道具ID */
  id?: number;
  /** 类型 */
  stage?: number;
  /** 价格 */
  level?: number;
  /** 可堆叠 */
  taskId?: number;
}

export class OpenConditionConfig {
  /** 数据 Map，key = id，可直接 for...in / Object.keys 遍历 */
  public static dataMap: Record<string, IOpenConditionConfig> = {};

  /** 根据 id 查询 */
  public static Get(key: number | string): IOpenConditionConfig | undefined {
    return OpenConditionConfig.dataMap[String(key)];
  }

  /** 根据字段值查找 */
  public static Find(field: keyof IOpenConditionConfig, value: any): IOpenConditionConfig | undefined {
    for (const k in OpenConditionConfig.dataMap) {
      if (OpenConditionConfig.dataMap[k][field] == value) return OpenConditionConfig.dataMap[k];
    }
    return undefined;
  }
}

/** OpenConditionConfig 元信息 */
export const OpenConditionConfigMeta = {
  keyField: 'id',
  fieldNames: ["id","stage","level","taskId"],
};
