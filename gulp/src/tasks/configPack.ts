import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { encryptJsonFile, mkdirs } from '../utils/crypto';
import { runExe } from '../utils/execUtils';
import { copyDirectory, findFilesByExt, removeDirectory, uploadDirectory } from '../utils/fileUtils';
import { GULP_BUILD_TEMP_DIR } from '../utils/paths';

// ============================================================
// 常量
// ============================================================

/** 临时工作目录下的 config 子目录 */
const TEMP_CONFIG_DIR = path.join(GULP_BUILD_TEMP_DIR, 'config');
/** exe 输出目录 */
const TEMP_OUTPUT_DIR = path.join(TEMP_CONFIG_DIR, 'output');
/** 合并后的 JSON 输出目录 */
const TEMP_JSON_MERGED_DIR = path.join(TEMP_OUTPUT_DIR, 'json_merged');
/** 加密前的 JSON 暂存目录 */
const TEMP_JSON_READY_DIR = path.join(GULP_BUILD_TEMP_DIR, 'json_ready');
/** 合并后的目标文件名 */
const MERGED_CONFIG_NAME = 'config.json';

// ============================================================
// 任务工厂
// ============================================================

/**
 * 创建配置表打包任务
 *
 * 完整流程:
 *   1. 清理并创建临时目录 gulpBuildTemp
 *   2. 拷贝 config.configPath 全部文件到 gulpBuildTemp/config
 *   3. 执行 gulpBuildTemp/config 下的 .exe 导表工具 (实时输出)
 *   4. 将 output/json_merged 下的 JSON 重命名为 config.json
 *   5. 加密 config.json → config.dat (加密模式) 或直接复制 JSON (非加密模式)
 *   6. 将最终产物拷贝到 config.configOutput
 *
 * @param configName 构建配置文件名称 (不含 .json 后缀)
 */
export function createPackConfigTablesTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const { encrypt } = config;
    const mode = encrypt ? 'encrypt' : 'copy';
    const taskName = `packConfigTables[${config.name}:${mode}]`;

    const task: TaskFunction = async (done) => {
        if (!config.configPath || process.env['SKIP_EXCEL'] === 'true') {
            console.log(`[${taskName}] ${process.env['SKIP_EXCEL'] === 'true' ? 'SKIP_EXCEL=true' : '未配置 configPath'}，跳过配置表打包`);
            done();
            return;
        }

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始打包配置表`);
        console.log(`[${taskName}] 模式: ${mode}`);
        console.log(`[${taskName}] 源目录: ${config.configPath}`);
        console.log(`[${taskName}] 输出目录: ${config.configOutput}`);
        console.log(`========================================\n`);

        try {
            // ================================================
            // Step 1: 清理并创建临时目录
            // ================================================
            console.log(`[Step 1/6] 准备临时工作目录...`);
            removeDirectory(GULP_BUILD_TEMP_DIR);
            mkdirs(GULP_BUILD_TEMP_DIR);
            console.log(`[Step 1/6] 临时目录已就绪: ${GULP_BUILD_TEMP_DIR}\n`);

            // ================================================
            // Step 2: 拷贝源文件到临时目录
            // ================================================
            console.log(`[Step 2/6] 拷贝源文件...`);
            console.log(`  配置表源: ${config.configPath}`);
            console.log(`  目标: ${TEMP_CONFIG_DIR}`);
            copyDirectory(config.configPath, TEMP_CONFIG_DIR);

            // 平台配置路径不为空时也拷贝到临时目录
            if (config.configPlatform) {
                console.log(`  平台配置源: ${config.configPlatform}`);
                copyDirectory(config.configPlatform, TEMP_CONFIG_DIR);
            }
            console.log(`[Step 2/6] 拷贝完成\n`);

            // ================================================
            // Step 3: 执行 .exe 导表工具
            // ================================================
            console.log(`[Step 3/6] 查找并执行导表工具...`);
            const exeFiles = findFilesByExt(TEMP_CONFIG_DIR, '.exe');

            if (exeFiles.length === 0) {
                throw new Error(
                    `在 ${TEMP_CONFIG_DIR} 中未找到 .exe 导表工具\n` +
                    `请确认 configPath 配置是否正确: ${config.configPath}`
                );
            }

            // 使用第一个找到的 exe
            const exeName = exeFiles[0];
            const exePath = path.join(TEMP_CONFIG_DIR, exeName);
            console.log(`  找到导表工具: ${exeName}`);
            console.log(`  完整路径: ${exePath}`);
            console.log(`  工作目录: ${TEMP_CONFIG_DIR}`);
            console.log(`  开始执行...\n`);
            console.log(`  -------- 导表工具输出 --------`);

            await runExe(exePath, TEMP_CONFIG_DIR);

            console.log(`  -------- 导表工具输出结束 --------\n`);
            console.log(`[Step 3/6] 导表工具执行完成\n`);

            // ================================================
            // Step 4: 处理合并后的 JSON → config.json
            // ================================================
            console.log(`[Step 4/6] 处理合并后的配置表...`);

            if (!fs.existsSync(TEMP_JSON_MERGED_DIR)) {
                throw new Error(
                    `导表输出目录不存在: ${TEMP_JSON_MERGED_DIR}\n` +
                    `请检查导表工具是否正常执行（查看上方输出日志）`
                );
            }

            const jsonFiles = findFilesByExt(TEMP_JSON_MERGED_DIR, '.json');
            console.log(`  在 json_merged 中找到 ${jsonFiles.length} 个 JSON 文件:`);
            jsonFiles.forEach(f => console.log(`    - ${f}`));

            if (jsonFiles.length === 0) {
                throw new Error(
                    `${TEMP_JSON_MERGED_DIR} 中没有找到 JSON 文件\n` +
                    `请检查导表工具是否正确生成了输出`
                );
            }

            // 清理并创建 JSON 暂存目录
            removeDirectory(TEMP_JSON_READY_DIR);
            mkdirs(TEMP_JSON_READY_DIR);

            if (jsonFiles.length === 1) {
                // 单个文件：直接重命名为 config.json
                const srcJsonPath = path.join(TEMP_JSON_MERGED_DIR, jsonFiles[0]);
                const destJsonPath = path.join(TEMP_JSON_READY_DIR, MERGED_CONFIG_NAME);
                fs.copyFileSync(srcJsonPath, destJsonPath);
                console.log(`  已重命名: ${jsonFiles[0]} → ${MERGED_CONFIG_NAME}`);
            } else {
                // 多个文件：第一个重命名为 config.json，其余保留原名
                const mainFile = jsonFiles[0];
                const mainSrcPath = path.join(TEMP_JSON_MERGED_DIR, mainFile);
                const mainDestPath = path.join(TEMP_JSON_READY_DIR, MERGED_CONFIG_NAME);
                fs.copyFileSync(mainSrcPath, mainDestPath);
                console.log(`  已重命名: ${mainFile} → ${MERGED_CONFIG_NAME}`);

                for (let i = 1; i < jsonFiles.length; i++) {
                    const srcPath = path.join(TEMP_JSON_MERGED_DIR, jsonFiles[i]);
                    const destPath = path.join(TEMP_JSON_READY_DIR, jsonFiles[i]);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`  已复制: ${jsonFiles[i]} (保留原名)`);
                }
            }
            console.log(`[Step 4/6] 配置表处理完成\n`);

            // ================================================
            // Step 5: 加密 (或复制) 并输出到最终目录
            // ================================================
            console.log(`[Step 5/6] ${encrypt ? '加密' : '复制'}并输出到最终目录...`);

            mkdirs(config.configOutput);

            const readyJsonFiles = findFilesByExt(TEMP_JSON_READY_DIR, '.json');
            const suffix = config.configOutputSuffix || '.json';

            if (encrypt) {
                readyJsonFiles.forEach((jsonFile, index) => {
                    const srcPath = path.join(TEMP_JSON_READY_DIR, jsonFile);
                    const destName = index === 0
                        ? `config${suffix}`
                        : jsonFile.replace('.json', suffix);
                    const destPath = path.join(config.configOutput, destName);
                    encryptJsonFile(srcPath, destPath);
                });
            } else {
                readyJsonFiles.forEach((jsonFile, index) => {
                    const srcPath = path.join(TEMP_JSON_READY_DIR, jsonFile);
                    const destName = index === 0
                        ? `config${suffix}`
                        : jsonFile.replace('.json', suffix);
                    const destPath = path.join(config.configOutput, destName);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`  已复制: ${jsonFile} → ${destName}`);
                });
            }
            console.log(`[Step 5/6] 输出完成\n`);

            // ================================================
            // Step 6: 统一 config 和 environment 文件后缀
            // ================================================
            console.log(`[Step 6/6] 统一输出文件后缀为 "${suffix}"...`);
            ensureSuffix(config.configOutput, 'config', suffix);
            ensureSuffix(config.configOutput, 'environment', suffix);
            console.log(`[Step 6/6] 后缀统一完成\n`);

            // ================================================
            // 完成 & 清理
            // ================================================
            removeDirectory(GULP_BUILD_TEMP_DIR);
            console.log(`========================================`);
            console.log(`[${taskName}] ✅ 配置表打包完成!`);
            console.log(`  输出目录: ${config.configOutput}`);
            console.log(`========================================\n`);

            // 上传配置表
            const configUploadPath = config.configUploadPath;
            if (configUploadPath && config.configOutput) {
                try {
                    uploadDirectory(config.configOutput, configUploadPath, taskName);
                } catch (err: any) {
                    console.error(`[${taskName}] ❌ 配置表上传失败: ${err.message}`);
                    done(err);
                    return;
                }
            }

            done();
        } catch (err: any) {
            console.error(`\n========================================`);
            console.error(`[${taskName}] ❌ 配置表打包失败`);
            console.error(`  错误: ${err.message}`);
            console.error(`  临时目录已保留，可用于排查: ${GULP_BUILD_TEMP_DIR}`);
            console.error(`========================================\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

/**
 * 确保输出目录中以 baseName 开头的文件使用指定后缀
 *
 * 如目录中有 config.dat 和 config.dat.txt，指定后缀为 ".dat"，
 * 则 config.dat.txt 重命名为 config.dat (覆盖)
 */
function ensureSuffix(dir: string, baseName: string, suffix: string): void {
    const pattern = `${baseName}.`;
    const target = `${baseName}${suffix}`;

    // 找到所有 baseName.* 但后缀非 target 的旧文件
    const files = fs.readdirSync(dir).filter(f => f.startsWith(pattern) && f !== target);

    // 目标文件是否已存在（Step 5 刚写入的）
    let targetExists = fs.existsSync(path.join(dir, target));

    for (const file of files) {
        const srcPath = path.join(dir, file);
        if (targetExists) {
            // 新文件已在，删除旧文件即可
            fs.unlinkSync(srcPath);
            console.log(`  后缀统一: 删除旧文件 ${file}`);
        } else {
            // 新文件不在，将旧文件重命名
            fs.renameSync(srcPath, path.join(dir, target));
            console.log(`  后缀统一: ${file} → ${target}`);
            targetExists = true;
        }
    }
}

