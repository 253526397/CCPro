import { spawn } from 'child_process';
import path from 'path';

/** 获取项目根路径 */
function getProjectPath(): string {
    // Editor.Project.path 在 Cocos Creator 3.x 运行时注入
    const editor = Editor as unknown as Record<string, unknown>;
    const proj = editor.Project as Record<string, unknown> | undefined;
    return (proj?.path as string) ?? '';
}

/**
 * 执行 gulp 任务
 *
 * @param task 要执行的 gulp 任务名，如 "pack"
 * @param config 配置名，如 "google-play"
 */
function runGulpTask(task: string, config: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const projectPath = Editor.Project.path;
        const gulpCmd = path.join(projectPath, 'node_modules', '.bin', 'gulp');
        const args = [task, '--config', config];

        console.log(`[gulp] 开始执行: npx gulp ${task} --config ${config}`);
        console.log(`[gulp] 工作目录: ${projectPath}`);

        const child = spawn(gulpCmd, args, {
            cwd: projectPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
        });

        child.stdout.on('data', (data: Buffer) => {
            console.log(data.toString().trimEnd());
        });

        child.stderr.on('data', (data: Buffer) => {
            console.error(data.toString().trimEnd());
        });

        if (child.stdin) {
            child.stdin.write('\r\n');
            child.stdin.end();
        }

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`[gulp] ✅ ${task} --config ${config} 执行完成`);
                resolve();
            } else {
                const msg = `[gulp] ❌ ${task} --config ${config} 执行失败，退出码: ${code}`;
                console.error(msg);
                reject(new Error(msg));
            }
        });

        child.on('error', (err) => {
            console.error(`[gulp] ❌ 无法启动 gulp: ${err.message}`);
            reject(err);
        });
    });
}

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    /**
     * @en A method that can be triggered by message
     * @zh 通过 message 触发的方法
     */
    showLog() {
        console.log('Hello World');
    },

    /** 执行 config/exceltools.bat 导出 Excel 配置 */
    configExport() {
        const projectPath = getProjectPath();
        const batPath = path.join(projectPath, 'tools', 'config', 'exceltools.bat');

        console.log(`[tools] Running: ${batPath}`);

        // Windows bat 必须通过 cmd /c 执行
        const child = spawn('cmd', ['/c', batPath], { cwd: path.join(projectPath, 'config') });

        child.stdout.on('data', (data: Buffer) => {
            console.log(data.toString().replace(/\r?\n$/, ''));
        });

        child.stderr.on('data', (data: Buffer) => {
            console.error(data.toString().replace(/\r?\n$/, ''));
        });

        child.on('close', (code: number | null) => {
            const status = code === 0 ? 'Done!' : `Exited with code: ${code}`;
            console.log(`\x1b[3m[tools] ${status}\x1b[0m`);
        });
    },
};

/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
export function load() {}

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
export function unload() {}
