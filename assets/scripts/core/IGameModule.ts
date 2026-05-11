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
