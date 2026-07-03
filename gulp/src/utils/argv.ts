/**
 * 简单的命令行参数解析器
 *
 * 支持格式:
 *   --key value
 *   --key=value
 *   --flag           (布尔值 true)
 *   --no-flag        (布尔值 false)
 *
 * gulp 调用示例:
 *   gulp pack --config dev
 *   gulp pack --config=release
 */

/** 从 process.argv 中提取用户自定义参数（过滤掉 gulp 内置参数） */
function parseArgv(): Record<string, string | boolean> {
    const raw = process.argv.slice(2);
    const result: Record<string, string | boolean> = {};

    for (let i = 0; i < raw.length; i++) {
        const arg = raw[i];

        // 跳过非 -- 开头的参数（gulp 任务名、gulp 内置参数等）
        if (!arg.startsWith('--')) {
            continue;
        }

        // --key=value 格式
        const eqIndex = arg.indexOf('=');
        if (eqIndex > 2) {
            const key = arg.slice(2, eqIndex);
            const value = arg.slice(eqIndex + 1);
            result[key] = value;
            continue;
        }

        const key = arg.slice(2);

        // --no-xxx 格式 → false
        if (key.startsWith('no-')) {
            result[key.slice(3)] = false;
            continue;
        }

        // --key value 格式 → 看下一个参数
        const next = raw[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
            result[key] = next;
            i++; // 跳过已消费的 value
        } else {
            // --flag 格式 → true
            result[key] = true;
        }
    }

    return result;
}

/** 解析结果缓存，只在首次访问时解析一次 */
let _parsed: Record<string, string | boolean> | null = null;

function getParsed(): Record<string, string | boolean> {
    if (_parsed === null) {
        _parsed = parseArgv();
    }
    return _parsed;
}

/**
 * 获取命令行参数值
 *
 * @param name 参数名 (不含 -- 前缀)
 * @param defaultValue 默认值
 *
 * @example
 * // gulp pack --config dev
 * getArgv('config')        // => 'dev'
 * getArgv('config', 'dev') // => 'dev'
 * getArgv('compress')      // => false (未传)
 * // gulp pack --compress
 * getArgv('compress')      // => true
 */
export function getArgv(name: string): string | undefined;
export function getArgv(name: string, defaultValue: string): string;
export function getArgv(name: string, defaultValue?: string): string | undefined {
    const parsed = getParsed();
    const value = parsed[name];
    if (value === undefined) {
        return defaultValue;
    }
    return String(value);
}

/**
 * 获取命令行布尔参数
 */
export function getArgvFlag(name: string, defaultValue: boolean = false): boolean {
    const parsed = getParsed();
    const value = parsed[name];
    if (value === undefined) {
        return defaultValue;
    }
    return Boolean(value);
}

/**
 * 获取所有用户自定义参数（调试用）
 */
export function getAllArgv(): Record<string, string | boolean> {
    return { ...getParsed() };
}
