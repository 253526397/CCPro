import { TaskFunction } from 'gulp';
import * as fs from 'fs';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { ROOT } from '../utils/paths';
import { resolveExePath, runExe } from '../utils/execUtils';

/**
 * 创建图片压缩任务
 *
 * 根据配置中的 compressAssetsImage 字段决定行为:
 * - 绝对路径 → 直接执行
 * - 相对路径/文件名 → 从项目根目录拼接后执行
 * - 空字符串 → 跳过压缩
 *
 * @param configName 构建配置文件名称
 */
export function createCompressAssetsTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `compressAssets[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const rawPath = config.compressAssetsImage;

        if (!rawPath) {
            console.log(`[${taskName}] 未配置图片压缩工具，跳过`);
            done();
            return;
        }

        const exePath = resolveExePath(rawPath);
        console.log(`[${taskName}] 开始图片压缩 (${rawPath})`);

        if (!fs.existsSync(exePath)) {
            console.error(`[${taskName}] ❌ 图片压缩工具不存在: ${exePath}`);
            done(new Error(`图片压缩工具不存在: ${exePath}`));
            return;
        }

        try {
            await runExe(exePath, ROOT, [], { silent: true });
            console.log(`[${taskName}] ✅ 图片压缩完成\n`);
            done();
        } catch (err: any) {
            console.error(`[${taskName}] ❌ 图片压缩失败: ${err.message}\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}
