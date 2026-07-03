/**
 * 外部进程执行工具
 */
import { spawn, exec } from 'child_process';
import * as path from 'path';
import { ROOT } from './paths';

/**
 * 解析 exe 路径
 * - 绝对路径 → 直接使用
 * - 相对路径/纯文件名 → 从项目根目录拼接
 * - 空字符串 → 返回空，表示跳过
 *
 * @returns 解析后的绝对路径，或空字符串（表示跳过）
 */
export function resolveExePath(rawPath: string): string {
    if (!rawPath) {
        return '';
    }

    // 绝对路径 (Windows: C:\... 或 \\...，Unix: /...)
    if (path.isAbsolute(rawPath)) {
        return rawPath;
    }

    // 相对路径 → 从项目根目录解析
    return path.join(ROOT, rawPath);
}

/** 执行选项 */
export interface RunExeOptions {
    /** 静默模式: 不输出 stdout，仅在出错时显示 stderr (默认 false) */
    silent?: boolean;
    /** 通过 shell 执行 (Windows 上解决 spawn 参数传递问题，默认 false) */
    shell?: boolean;
}

/**
 * 执行 exe 文件，实时输出 stdout/stderr
 *
 * Dart 编写的工具在完成工作后通常会调用 "按任意键关闭" 等待 stdin 输入。
 * 这里使用 'pipe' 提供有效句柄，并立即写入换行符来满足该逻辑。
 *
 * @param exePath exe 文件绝对路径
 * @param cwd 工作目录
 * @param args 命令行参数
 * @param options 执行选项
 * @returns 执行完成时 resolve，失败时 reject
 */
export function runExe(
    exePath: string,
    cwd: string,
    args: string[] = [],
    options: RunExeOptions = {}
): Promise<void> {
    const { silent = false, shell = false } = options;

    return new Promise((resolve, reject) => {
        let stderrBuf = '';

        const child = spawn(exePath, args, {
            cwd,
            stdio: ['pipe', silent ? 'pipe' : 'inherit', silent ? 'pipe' : 'inherit'],
            windowsHide: true,
            shell,
        });

        if (child.stdin) {
            child.stdin.write('\r\n');
            child.stdin.end();
        }

        if (silent && child.stderr) {
            child.stderr.on('data', (data: Buffer) => {
                stderrBuf += data.toString();
            });
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                const msg = `退出码: ${code}`;
                if (silent && stderrBuf) {
                    reject(new Error(`${msg}\n${stderrBuf.trim()}`));
                } else {
                    reject(new Error(msg));
                }
            }
        });

        child.on('error', (err) => {
            reject(new Error(`无法启动: ${err.message}\n路径: ${exePath}`));
        });
    });
}

/**
 * 通过 spawn 执行完整命令字符串 (支持指定 shell)
 *
 * 适用于 spawn 参数传递与终端不一致的场景（如 Electron 应用）。
 * stdout/stderr 实时输出。
 *
 * @param command 完整命令字符串
 * @param cwd 工作目录
 * @param shell 指定 shell (如 'powershell.exe')，默认 cmd.exe
 */
export function runCommand(command: string, cwd: string, shell?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // shell 指定时直接用 spawn 调对应 shell，避免 exec 的 cmd.exe 参数模式
        const child = shell
            ? spawn(shell, ['-NoProfile', '-Command', command], {
                  cwd,
                  stdio: ['pipe', 'inherit', 'inherit'],
                  windowsHide: true,
              })
            : exec(command, { cwd, windowsHide: true });

        if (child.stdout) {
            child.stdout.pipe(process.stdout);
        }
        if (child.stderr) {
            child.stderr.pipe(process.stderr);
        }

        if (child.stdin) {
            child.stdin.write('\r\n');
            child.stdin.end();
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`退出码: ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`无法启动: ${err.message}`));
        });
    });
}
