import type { IGameModule } from './IGameModule';

/**
 * 全局模块管理器，负责业务模块的注册、查找和生命周期调度。
 *
 * 通过字符串 key 查找模块，避免模块间因 import 类构造函数产生循环引用。
 * 调用方不需要 import 目标模块的类，只需知道模块名即可。
 *
 * @example
 * // 注册（仅在 GameEntry 中，由 GameEntry import 所有模块）
 * ModuleManager.inst.register(ChestModule);
 *
 * // 查找（任意模块中，无需 import ChestModule）
 * const chest = ModuleManager.inst.get('ChestModule') as ChestModule;
 * // 如需类型提示，使用 import type（编译时擦除，不产生循环引用）
 * import type { ChestModule } from '../chest/ChestModule';
 */
export class ModuleManager {
  private static _inst: ModuleManager;
  static get inst(): ModuleManager {
    if (!this._inst) this._inst = new ModuleManager();
    return this._inst;
  }

  private modules: Map<string, IGameModule> = new Map();
  private order: string[] = [];

  /**
   * 注册模块实例，key 自动取自类名。
   * 仅在 GameEntry 初始化时调用，注册顺序即生命周期调用顺序。
   */
  register(ctor: new () => IGameModule): IGameModule {
    const key = ctor.name;
    if (this.modules.has(key)) {
      return this.modules.get(key)!;
    }
    const instance = new ctor();
    this.modules.set(key, instance);
    this.order.push(key);
    return instance;
  }

  /**
   * 按字符串 key 获取模块实例。
   * 调用方只需传类名字符串，无需 import 目标模块，彻底避免循环引用。
   */
  get(key: string): IGameModule | undefined {
    return this.modules.get(key);
  }

  /** 所有模块 onInit */
  onInit(): void {
    this.order.forEach(key => this.modules.get(key)!.onInit());
  }

  /** 所有模块 onConfigLoaded */
  onConfigLoaded(): void {
    this.order.forEach(key => this.modules.get(key)!.onConfigLoaded());
  }

  /** 所有模块 onGameStart */
  onGameStart(): void {
    this.order.forEach(key => this.modules.get(key)!.onGameStart());
  }

  /** 所有模块 onCleanup（切账号时调用） */
  onCleanup(): void {
    this.order.forEach(key => this.modules.get(key)!.onCleanup());
  }

  /** 获取所有模块实例 */
  getAll(): IGameModule[] {
    return this.order.map(key => this.modules.get(key)!);
  }
}
