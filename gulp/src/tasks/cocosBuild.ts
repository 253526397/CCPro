import { spawn } from 'child_process';
import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { ROOT } from '../utils/paths';

/**
 * 创建 Cocos Creator 构建任务
 *
 * 直接通过 spawn 调用 CocosCreator.exe 执行构建。
 *
 * @param configName 构建配置文件名称
 */
export function createCocosBuildTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `cocosBuild[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const creatorPath = config.creatorPath;
        const buildConfigPath = config.buildConfigPath;

        if (!creatorPath) {
            console.log(`[${taskName}] 未配置 creatorPath，跳过 Cocos Creator 构建`);
            done();
            return;
        }

        if (!fs.existsSync(creatorPath)) {
            console.error(`[${taskName}] ❌ CocosCreator.exe 不存在: ${creatorPath}`);
            done(new Error(`CocosCreator.exe 不存在: ${creatorPath}`));
            return;
        }

        if (!buildConfigPath || !fs.existsSync(buildConfigPath)) {
            console.error(`[${taskName}] ❌ 构建配置文件不存在: ${buildConfigPath}`);
            done(new Error(`构建配置文件不存在: ${buildConfigPath}`));
            return;
        }

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始 Cocos Creator 构建`);
        console.log(`[${taskName}] Creator: ${creatorPath}`);
        console.log(`[${taskName}] 项目: ${ROOT}`);
        console.log(`[${taskName}] 构建配置: ${buildConfigPath}`);
        console.log(`========================================\n`);

        console.log(`  -------- Cocos Creator 构建输出 --------`);

        try {
            await runCreator(creatorPath, ROOT, buildConfigPath);
            console.log(`  -------- Cocos Creator 构建结束 --------\n`);
            console.log(`[${taskName}] ✅ Cocos Creator 构建完成\n`);
            done();
        } catch (err: any) {
            console.error(`  -------- Cocos Creator 构建结束 --------\n`);
            console.error(`[${taskName}] ❌ Cocos Creator 构建失败: ${err.message}\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

/**
 * 直接通过 spawn 调用 CocosCreator.exe，stdout/stderr 实时输出
 *
 * Cocos Creator 退出时常有缓存错误导致非零退出码（如 36），
 * 但构建本身可能已成功。通过检查输出内容判断真实结果。
 */
function runCreator(creatorPath: string, projectPath: string, configPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const args = ['--project', projectPath, '--build', `configPath=${configPath}`];
        const child = spawn(creatorPath, args, {
            cwd: projectPath,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let output = '';

        child.stdout.on('data', (data: Buffer) => {
            const text = data.toString();
            output += text;
            process.stdout.write(data);
        });
        child.stderr.on('data', (data: Buffer) => {
            output += data.toString();
            process.stderr.write(data);
        });

        if (child.stdin) {
            child.stdin.write('\r\n');
            child.stdin.end();
        }

        child.on('close', (code) => {
            // 构建完成标志: "build Task ... Finished"
            const buildFinished = /build\s+Task.*Finished/i.test(output);

            if (code === 0 || buildFinished) {
                resolve();
            } else {
                reject(new Error(`退出码: ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`无法启动 CocosCreator: ${err.message}`));
        });
    });
}
