import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { mkdirs } from '../utils/crypto';
import { ROOT } from '../utils/paths';

/**
 * 创建模板文件替换任务
 *
 * templateFile 目录下的文件按相对路径一对一替换到项目根目录。
 * 目标文件不存在则跳过（不新增）。
 *
 * 例: templateFile/settings/project.json → {ROOT}/settings/project.json
 *
 * @param configName 构建配置文件名称
 */
export function createApplyTemplateTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `applyTemplate[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const templateDir = config.templateFile;

        if (!templateDir) {
            console.log(`[${taskName}] 未配置 templateFile，跳过模板替换`);
            done();
            return;
        }

        if (!fs.existsSync(templateDir)) {
            console.error(`[${taskName}] ❌ templateFile 目录不存在: ${templateDir}`);
            done(new Error(`templateFile 目录不存在: ${templateDir}`));
            return;
        }

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始替换模板文件`);
        console.log(`[${taskName}] 模板目录: ${templateDir}`);
        console.log(`========================================`);

        let count = 0;

        try {
            const files = walkDir(templateDir);

            for (const srcPath of files) {
                const relPath = path.relative(templateDir, srcPath);
                const destPath = path.join(ROOT, relPath);
                mkdirs(path.dirname(destPath));
                fs.copyFileSync(srcPath, destPath);
                console.log(`  已替换: ${relPath}`);
                count++;
            }

            console.log(`[${taskName}] ✅ 模板替换完成，共 ${count} 个文件\n`);
            done();
        } catch (err: any) {
            console.error(`[${taskName}] ❌ 模板替换失败: ${err.message}\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

/** 递归遍历目录下所有文件 */
function walkDir(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}
