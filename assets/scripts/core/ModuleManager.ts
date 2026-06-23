/**
 * 全局模块管理器，负责业务模块的注册、查找和生命周期调度。
 *
 * 通过字符串 key 查找模块。get() 始终返回可用对象：
 * - 模块已注册 → 返回真实实例
 * - 模块未注册 → 返回 SafeProxy，所有方法调用静默吞掉不报错
 *
 * 模块之间可以直接调用方法通信，不再需要 EventBus。
 *
 * @example
 * // 注册（仅在 GameEntry 中）
 * ModuleManager.inst.register(ChestModule);
 *
 * // 查找（任意模块中，无需 import ChestModule）
 * import type { ChestModule } from '../chest/ChestModule';
 * const chest = ModuleManager.inst.get<ChestModule>('ChestModule');
 * chest.openChest('gold'); // B未注册时静默跳过，不报错
 */
export class ModuleManager {
  private static _inst: ModuleManager;
  static get inst(): ModuleManager {
    if (!this._inst) this._inst = new ModuleManager();
    return this._inst;
  }

  private modules: Map<string, IGameModule> = new Map();
  private order: string[] = [];

  /** 未注册模块的占位 Proxy，所有属性访问都返回空函数 */
  private readonly safeProxy: IGameModule = new Proxy({} as IGameModule, {
    get() {
      console.warn(`[ModuleManager] Module ${this.name} not registered.`);
      return () => {};
    },
  });

  /**
   * 注册模块实例，key 自动取自类名。
   * 仅在 GameEntry 初始化时调用，注册顺序即生命周期调用顺序。
   */
  register<T extends IGameModule>(moduleName:string, ctor: new () => T): T {
    const key = moduleName;
    if (this.modules.has(key)) {
      return this.modules.get(key) as T;
    }
    const instance = new ctor();
    this.modules.set(key, instance);
    this.order.push(key);
    return instance;
  }

  /**
   * 按字符串 key 获取模块实例。
   * 已注册 → 返回真实实例；未注册 → 返回 SafeProxy（不会返回 undefined/报错）。
   * 调用方只需传类名字符串，无需 import 目标模块，彻底避免循环引用。
   */
  get<T extends IGameModule = IGameModule>(key: string): T {
    return (this.modules.get(key) as T) || (this.safeProxy as T);
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

/**
 * 业务模块生命周期接口，所有业务模块必须实现。
 *
 * 调用时序：
 *   GameEntry.init()
 *     → modules.forEach(onInit)
 *     → ConfigService 加载配置表
 *     → modules.forEach(onConfigLoaded)
 *     → EventBus.emit("game:ready")
 *     → modules.forEach(onGameStart)
 *
 *   切换账号：
 *     → modules.forEach(onCleanup)
 *     → 重新走 onInit → onConfigLoaded → onGameStart
 */
export interface IGameModule {
  /** 模块初始化 — 注册事件监听、创建单例 */
  onInit(): void;

  /** 配置表加载完成 — 可安全读取策划数据 */
  onConfigLoaded(): void;

  /** 游戏正式开始 — 触发业务逻辑 */
  onGameStart(): void;

  /** 清理玩家数据 — 切换账号时调用，恢复到模块初始状态 */
  onCleanup(): void;
}
