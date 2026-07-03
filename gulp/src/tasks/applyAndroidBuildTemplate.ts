import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { mkdirs } from '../utils/crypto';
import { uploadDirectory } from '../utils/fileUtils';
import { GULP_BUILD_DIR, ROOT } from '../utils/paths';

/**
 * 创建构建后模板替换任务
 *
 * 构建完成后，将 {buildTemplatePath}/{platform}/ 目录下的文件
 * 按相对路径一对一替换到 buildOutput 目录。
 *
 * 例: buildTmp/google-play/libs/xxx.jar → {buildOutput}/libs/xxx.jar
 *
 * buildTemplatePath 为空或模板目录不存在则跳过。
 *
 * @param configName 构建配置文件名称
 */
export function createApplyAndroidBuildTemplateTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `applyBuildTemplate[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const buildTemplatePath = config.buildTemplatePath;
        const buildOutput = config.buildOutput;

        if (!buildTemplatePath) {
            console.log(`[${taskName}] 未配置 buildTemplatePath，跳过构建后模板替换`);
            done();
            return;
        }

        const templateDir = buildTemplatePath;

        if (!fs.existsSync(templateDir)) {
            console.log(`[${taskName}] 模板目录不存在，跳过: ${templateDir}`);
            done();
            return;
        }

        if (!buildOutput) {
            console.log(`[${taskName}] 未配置 buildOutput，跳过构建后模板替换`);
            done();
            return;
        }

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始构建后模板替换`);
        console.log(`[${taskName}] 模板目录: ${templateDir}`);
        console.log(`[${taskName}] 目标目录: ${buildOutput}`);
        console.log(`========================================`);

        let count = 0;

        try {
            const entries = walkDir(templateDir);

            for (const srcPath of entries) {
                const relPath = path.relative(templateDir, srcPath);
                const destPath = path.join(buildOutput, relPath);
                if (fs.statSync(srcPath).isDirectory()) {
                    mkdirs(destPath);
                } else {
                    mkdirs(path.dirname(destPath));
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`  已替换: ${relPath}`);
                    count++;
                }
            }

            console.log(`[${taskName}] ✅ 构建后模板替换完成，共 ${count} 个文件\n`);

            // 版本号自增（所有平台）
            applyVersionBump(config.platform, config.versionCode, config.versionName, configName, taskName);

            // 修改 gradle.properties PROP_MIN_SDK_VERSION（所有平台）
            applyMinSdkPatch(buildOutput, taskName);

            // Asset Pack 处理（由 needAssetPack 配置控制）
            if (config.needAssetPack) {
                applyAssetPackPatches(buildOutput, taskName);
            }

            // 上传构建产物
            const buildUploadPath = config.buildUploadPath;
            if (buildUploadPath && buildOutput) {
                try {
                    uploadDirectory(buildOutput, buildUploadPath, taskName);
                } catch (err: any) {
                    console.error(`[${taskName}] ❌ 构建产物上传失败: ${err.message}`);
                    done(err);
                    return;
                }
            }

            done();
        } catch (err: any) {
            console.error(`[${taskName}] ❌ 构建后模板替换失败: ${err.message}\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

/**
 * 修改 proj/gradle.properties 中 PROP_MIN_SDK_VERSION 为 25（所有平台）
 */
function applyMinSdkPatch(
    buildOutput: string,
    taskName: string,
): void {
    console.log(`[${taskName}] 修改 PROP_MIN_SDK_VERSION...`);

    const gradlePropsPath = path.join(buildOutput, 'proj', 'gradle.properties');
    if (fs.existsSync(gradlePropsPath)) {
        let content = fs.readFileSync(gradlePropsPath, 'utf-8');
        const oldValue = content.match(/PROP_MIN_SDK_VERSION=(\d+)/);
        if (oldValue && oldValue[1] !== '25') {
            content = content.replace(/PROP_MIN_SDK_VERSION=\d+/, 'PROP_MIN_SDK_VERSION=25');
            fs.writeFileSync(gradlePropsPath, content, 'utf-8');
            console.log(`  gradle.properties: PROP_MIN_SDK_VERSION ${oldValue[1]} → 25`);
        } else {
            console.log(`  gradle.properties: PROP_MIN_SDK_VERSION 无需修改`);
        }
    } else {
        console.log(`  gradle.properties 不存在: ${gradlePropsPath}`);
    }
}

/**
 * Asset Pack 处理（由 needAssetPack 配置控制）：
 * 1. 修改 settings.gradle，若缺少 include ':assetPack' 则追加
 * 2. 确保 assetPack/src/main/assets/ 有内容，空目录会导致 Gradle 构建失败
 */
function applyAssetPackPatches(
    buildOutput: string,
    taskName: string,
): void {
    console.log(`[${taskName}] 执行 Asset Pack 处理...`);

    // 1. 修改 settings.gradle，若缺少 include ':assetPack' 则追加
    const settingsGradlePath = path.join(buildOutput, 'proj', 'settings.gradle');
    if (fs.existsSync(settingsGradlePath)) {
        let content = fs.readFileSync(settingsGradlePath, 'utf-8');
        if (/include\s+['"]:assetPack['"]/.test(content)) {
            console.log(`  settings.gradle: include ':assetPack' 已存在，无需修改`);
        } else {
            const lines = content.split(/\r?\n/);
            const insertLine = "include ':assetPack'";
            lines.splice(lines.length - 1, 0, insertLine);
            content = lines.join('\n');
            fs.writeFileSync(settingsGradlePath, content, 'utf-8');
            console.log(`  settings.gradle: 已添加 include ':assetPack'`);
        }
    } else {
        console.log(`  settings.gradle 不存在: ${settingsGradlePath}`);
    }

    // 2. 确保 assetPack/src/main/assets/ 有内容，空目录会导致 Gradle 构建失败
    const assetPackAssetsDir = path.join(buildOutput, 'proj', 'assetPack', 'src', 'main', 'assets');
    if (fs.existsSync(assetPackAssetsDir)) {
        if (isDirEmpty(assetPackAssetsDir)) {
            const placeholder = path.join(assetPackAssetsDir, '.gitkeep');
            fs.writeFileSync(placeholder, '', 'utf-8');
            console.log(`  assetPack: assets 目录为空，已添加占位文件`);
        } else {
            console.log(`  assetPack: assets 目录已有内容，无需处理`);
        }
    } else {
        mkdirs(assetPackAssetsDir);
        const placeholder = path.join(assetPackAssetsDir, '.gitkeep');
        fs.writeFileSync(placeholder, '', 'utf-8');
        console.log(`  assetPack: assets 目录不存在，已创建并添加占位文件`);
    }
}

/**
 * 版本号自增（所有平台）：
 * 1. 修改 native/engine/${platform}/app/build.gradle 中的 versionCode / versionName
 * 2. 写回 .json5 配置文件
 */
function applyVersionBump(
    platform: string,
    versionCode: string,
    versionName: string,
    configName: string,
    taskName: string,
): void {
    console.log(`[${taskName}] 执行版本号自增...`);

    const newVersionCode = String(parseInt(versionCode, 10) + 1);
    const newVersionName = (parseFloat(versionName) + 0.01).toFixed(2);
    const buildGradlePath = path.join(ROOT, 'native', 'engine', platform, 'app', 'build.gradle');

    if (fs.existsSync(buildGradlePath)) {
        let content = fs.readFileSync(buildGradlePath, 'utf-8');
        content = content.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
        content = content.replace(/versionName\s+"[\d.]+"/, `versionName "${newVersionName}"`);
        fs.writeFileSync(buildGradlePath, content, 'utf-8');
        console.log(`  build.gradle: versionCode ${versionCode} → ${newVersionCode}, versionName ${versionName} → ${newVersionName}`);
    } else {
        console.log(`  build.gradle 不存在: ${buildGradlePath}`);
    }

    // 写回 .json5 配置文件
    const json5Path = path.join(GULP_BUILD_DIR, `${configName}.json5`);
    if (fs.existsSync(json5Path)) {
        let content = fs.readFileSync(json5Path, 'utf-8');
        content = content.replace(/"versionCode"\s*:\s*"[^"]*"/, `"versionCode": "${newVersionCode}"`);
        content = content.replace(/"versionName"\s*:\s*"[^"]*"/, `"versionName": "${newVersionName}"`);
        fs.writeFileSync(json5Path, content, 'utf-8');
        console.log(`  .json5: versionCode/versionName 已写回`);
    }
}

/** 判断目录是否为空（不含任何文件） */
function isDirEmpty(dir: string): boolean {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isFile()) return false;
        if (entry.isDirectory() && !isDirEmpty(path.join(dir, entry.name))) return false;
    }
    return true;
}

/** 递归遍历目录下所有文件和目录（包含空目录） */
function walkDir(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    if (entries.length === 0) {
        // 空目录：标记自身
        results.push(dir);
        return results;
    }
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
