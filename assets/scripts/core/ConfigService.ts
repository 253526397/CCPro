/**
 * 策划配置表服务，提供类型安全的表数据查询。
 * 配置在游戏启动时从本地/远程加载后通过 registerTable 注册。
 * 所有配置查询不需要引擎依赖，可在单元测试中使用。
 */
export class ConfigService {
  private static _inst: ConfigService;
  static get inst(): ConfigService {
    if (!this._inst) this._inst = new ConfigService();
    return this._inst;
  }

  private store: Map<string, Map<number, any>> = new Map();

  /**
   * 注册配置表，以 id 为 key 建立索引。
   * @param tableName 表名，用作查询时的标识
   * @param rows 配置行数组，每行必须有 id 字段
   */
  registerTable<T extends { id: number }>(tableName: string, rows: T[]): void {
    const map = new Map<number, T>();
    rows.forEach(row => map.set(row.id, row));
    this.store.set(tableName, map);
  }

  /** 按 id 获取单条配置 */
  get<T>(tableName: string, id: number): T | undefined {
    const table = this.store.get(tableName);
    if (!table) return undefined;
    return table.get(id) as T;
  }

  /** 获取表中全部配置 */
  getAll<T>(tableName: string): T[] {
    const table = this.store.get(tableName);
    if (!table) return [];
    return Array.from(table.values()) as T[];
  }

  /** 按条件查找第一条匹配的配置 */
  find<T>(tableName: string, predicate: (item: T) => boolean): T | undefined {
    const all = this.getAll<T>(tableName);
    return all.find(predicate);
  }

  /** 检查指定 id 的配置是否存在 */
  has(tableName: string, id: number): boolean {
    const table = this.store.get(tableName);
    return table ? table.has(id) : false;
  }
}
