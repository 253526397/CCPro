import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { mkdirs } from '../utils/crypto';
import { copyDirectory, removeDirectory } from '../utils/fileUtils';

/**
 * 创建远端资源同步任务
 *
 * 将 remoteRes 目录下的所有内容复制到 localRemoteRes。
 * remoteRes 或 localRemoteRes 为空则跳过。
 *
 * @param configName 构建配置文件名称
 */
export function createSyncRemoteResTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `syncRemoteRes[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const remoteRes = config.remoteRes;
        const localRemoteRes = config.localRemoteRes;

        if (!remoteRes) {
            console.log(`[${taskName}] 未配置 remoteRes，跳过远端资源同步`);
            done();
            return;
        }

        if (!localRemoteRes) {
            console.log(`[${taskName}] 未配置 localRemoteRes，跳过远端资源同步`);
            done();
            return;
        }

        if (!fs.existsSync(remoteRes)) {
            console.error(`[${taskName}] ❌ remoteRes 目录不存在: ${remoteRes}`);
            done(new Error(`remoteRes 目录不存在: ${remoteRes}`));
            return;
        }

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始同步远端资源`);
        console.log(`[${taskName}] 源: ${remoteRes}`);
        console.log(`[${taskName}] 目标: ${localRemoteRes}`);
        console.log(`========================================\n`);

        try {
            // 先清理目标目录，再拷贝
            removeDirectory(localRemoteRes);
            mkdirs(localRemoteRes);
            copyDirectory(remoteRes, localRemoteRes);

            const fileCount = countFiles(localRemoteRes);
            console.log(`[${taskName}] ✅ 远端资源同步完成，共 ${fileCount} 个文件\n`);
            done();
        } catch (err: any) {
            console.error(`[${taskName}] ❌ 远端资源同步失败: ${err.message}\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

/** 递归统计目录中的文件数量 */
function countFiles(dir: string): number {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        } else {
            count++;
        }
    }
    return count;
}
