export class ConfigService {
  private static _inst: ConfigService;
  static get inst(): ConfigService {
    if (!this._inst) this._inst = new ConfigService();
    return this._inst;
  }

  private store: Map<string, Map<number, any>> = new Map();

  registerTable<T extends { id: number }>(tableName: string, rows: T[]): void {
    const map = new Map<number, T>();
    rows.forEach(row => map.set(row.id, row));
    this.store.set(tableName, map);
  }

  get<T>(tableName: string, id: number): T | undefined {
    const table = this.store.get(tableName);
    if (!table) return undefined;
    return table.get(id) as T;
  }

  getAll<T>(tableName: string): T[] {
    const table = this.store.get(tableName);
    if (!table) return [];
    return Array.from(table.values()) as T[];
  }

  find<T>(tableName: string, predicate: (item: T) => boolean): T | undefined {
    const all = this.getAll<T>(tableName);
    return all.find(predicate);
  }

  has(tableName: string, id: number): boolean {
    const table = this.store.get(tableName);
    return table ? table.has(id) : false;
  }
}
