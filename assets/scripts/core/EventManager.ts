/** 事件回调类型 */
type EventCallback = (...args: any[]) => void;

/** 单条监听记录结构 */
interface EventRecord {
    caller: any;
    callback: EventCallback;
}

/**
 * 全局静态事件管理器
 * 全局统一收发事件，解耦模块
 */
export default class EventManager {
    /**
     * 事件注册表
     * key: 事件名
     * value: 该事件下所有监听数组
     */
    private static _eventMap: Map<string, EventRecord[]> = new Map();

    /**
     * 监听事件
     * @param eventName 事件名称
     * @param caller 调用者上下文（用于批量解绑，建议传this）
     * @param func 回调函数
     */
    public static on(eventName: string, caller: any, func: EventCallback): void {
        if (!eventName || !func) return;

        // 获取当前事件监听列表，不存在则初始化
        let list = EventManager._eventMap.get(eventName);
        if (!list) {
            list = [];
            EventManager._eventMap.set(eventName, list);
        }

        // 防重复绑定：同一个caller+同一个回调不重复添加
        const isRepeat = list.some(item => item.caller === caller && item.callback === func);
        if (isRepeat) return;

        list.push({
            caller,
            callback: func
        });
    }

    /**
     * 一次性监听：触发一次后自动解绑
     * @param eventName 事件名
     * @param caller 调用者
     * @param func 回调
     */
    public static once(eventName: string, caller: any, func: EventCallback): void {
        const onceWrap = (...args: any[]) => {
            // 触发后立刻移除自身
            EventManager.off(eventName, caller, onceWrap);
            func.apply(caller, args);
        };
        EventManager.on(eventName, caller, onceWrap);
    }

    /**
     * 移除指定事件的指定监听
     * @param eventName 事件名
     * @param caller 绑定的调用者
     * @param func 回调函数
     */
    public static off(eventName: string, caller: any, func: EventCallback): void {
        const list = EventManager._eventMap.get(eventName);
        if (!list) return;

        // 过滤掉匹配的监听
        const newList = list.filter(item => !(item.caller === caller && item.callback === func));
        if (newList.length === 0) {
            // 无监听直接删除key，节省内存
            EventManager._eventMap.delete(eventName);
        } else {
            EventManager._eventMap.set(eventName, newList);
        }
    }

    /**
     * 批量解绑：移除某个caller绑定的**所有事件**
     * 组件销毁必调用，杜绝内存泄漏
     * @param caller 调用者this
     */
    public static offAllByCaller(caller: any): void {
        if (!caller) return;
        // 遍历所有事件分组
        EventManager._eventMap.forEach((list, eventKey) => {
            const restList = list.filter(item => item.caller !== caller);
            if (restList.length === 0) {
                EventManager._eventMap.delete(eventKey);
            } else {
                EventManager._eventMap.set(eventKey, restList);
            }
        });
    }

    /**
     * 派发事件，传递任意参数
     * @param eventName 事件名
     * @param args 任意回调参数
     */
    public static emit(eventName: string, ...args: any[]): void {
        const list = EventManager._eventMap.get(eventName);
        if (!list || list.length === 0) return;

        // 拷贝一份数组遍历，防止遍历中途增删监听导致错乱
        const copyList = [...list];
        for (const record of copyList) {
            // 绑定caller上下文执行回调
            record.callback.apply(record.caller, args);
        }
    }

    /**
     * 清空全部事件（游戏切场景、重启时调用）
     */
    public static clearAll(): void {
        EventManager._eventMap.clear();
    }

    /**
     * 查询某个事件是否存在监听（调试用）
     */
    public static hasEvent(eventName: string): boolean {
        const list = EventManager._eventMap.get(eventName);
        return !!list && list.length > 0;
    }
}