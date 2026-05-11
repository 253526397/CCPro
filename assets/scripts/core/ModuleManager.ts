import type { IGameModule } from './IGameModule';

/**
 * 全局模块管理器，负责业务模块的注册、查找和生命周期调度。
 * 模块通过构造函数注册，不依赖静态单例，避免循环引用。
 *
 * @example
 * const chest = ModuleManager.inst.register(ChestModule);
 * const chest = ModuleManager.inst.get(ChestModule);
 */
export class ModuleManager {
  private static _inst: ModuleManager;
  static get inst(): ModuleManager {
    if (!this._inst) this._inst = new ModuleManager();
    return this._inst;
  }

  private modules: Map<new () => IGameModule, IGameModule> = new Map();
  private order: (new () => IGameModule)[] = [];

  /**
   * 按构造函数注册模块实例，返回创建的实例。
   * 注册顺序即生命周期调用顺序。
   */
  register<T extends IGameModule>(ctor: new () => T): T {
    if (this.modules.has(ctor)) {
      return this.modules.get(ctor) as T;
    }
    const instance = new ctor();
    this.modules.set(ctor, instance);
    this.order.push(ctor);
    return instance;
  }

  /** 按构造函数获取已注册的模块实例 */
  get<T extends IGameModule>(ctor: new () => T): T {
    return this.modules.get(ctor) as T;
  }

  /** 所有模块 onInit */
  onInit(): void {
    this.order.forEach(ctor => this.modules.get(ctor)!.onInit());
  }

  /** 所有模块 onConfigLoaded */
  onConfigLoaded(): void {
    this.order.forEach(ctor => this.modules.get(ctor)!.onConfigLoaded());
  }

  /** 所有模块 onGameStart */
  onGameStart(): void {
    this.order.forEach(ctor => this.modules.get(ctor)!.onGameStart());
  }

  /** 所有模块 onCleanup（切账号时调用） */
  onCleanup(): void {
    this.order.forEach(ctor => this.modules.get(ctor)!.onCleanup());
  }

  /** 获取所有模块实例 */
  getAll(): IGameModule[] {
    return this.order.map(ctor => this.modules.get(ctor)!);
  }
}
