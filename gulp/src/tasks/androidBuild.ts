import { spawn } from 'child_process';
import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';
import { mkdirs } from '../utils/crypto';
import { ROOT } from '../utils/paths';

/**
 * 创建 Android 构建任务
 *
 * 仅在 google-play 平台且配置了 androidBuildType 时执行。
 * 在 buildOutput/proj/ 下执行 gradle 打包，生成 APK 或 AAB。
 *
 * @param configName 构建配置文件名称
 */
export function createAndroidBuildTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `androidBuild[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const platform = config.platform;
        const androidBuildType = config.androidBuildType;
        const buildOutput = config.buildOutput;

        // 仅 google-play 平台执行
        if (platform !== 'google-play') {
            console.log(`[${taskName}] 平台非 google-play (${platform})，跳过 Android 构建`);
            done();
            return;
        }

        if (!androidBuildType) {
            console.log(`[${taskName}] 未配置 androidBuildType，跳过 Android 构建`);
            done();
            return;
        }

        // "AAB" / "APK" → Gradle 任务名
        const gradleTask = mapBuildType(androidBuildType);
        if (!gradleTask) {
            console.error(`[${taskName}] ❌ 不支持的 androidBuildType: "${androidBuildType}"，请使用 "AAB"、"APK" 或 "Both"`);
            done(new Error(`不支持的 androidBuildType: ${androidBuildType}`));
            return;
        }

        if (!buildOutput) {
            console.log(`[${taskName}] 未配置 buildOutput，跳过 Android 构建`);
            done();
            return;
        }

        const projDir = path.join(buildOutput, 'proj');
        if (!fs.existsSync(projDir)) {
            console.error(`[${taskName}] ❌ proj 目录不存在: ${projDir}`);
            done(new Error(`proj 目录不存在: ${projDir}`));
            return;
        }

        // 检查环境变量
        const androidHome = process.env['ANDROID_HOME'] || '';
        const javaHome = process.env['JAVA_HOME'] || '';

        if (!androidHome) {
            console.error(`[${taskName}] ❌ 环境变量 ANDROID_HOME 未设置`);
            done(new Error('ANDROID_HOME 未设置'));
            return;
        }

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始 Android 构建`);
        console.log(`[${taskName}] 构建类型: ${androidBuildType} → ${gradleTask}`);
        console.log(`[${taskName}] 项目目录: ${projDir}`);
        console.log(`[${taskName}] ANDROID_HOME: ${androidHome}`);
        console.log(`[${taskName}] JAVA_HOME: ${javaHome}`);
        console.log(`========================================\n`);

        try {
            // 1. 清理 native 引擎 res 目录下的 .png
            // cleanNativeResPng(platform, taskName);

            // 2. 生成 local.properties
            writeLocalProperties(projDir, androidHome, taskName);

            // 3. 查找 gradlew.bat
            const gradlewPath = findGradlew(projDir, taskName);
            if (!gradlewPath) {
                done(new Error(
                    `找不到 gradlew.bat，请将 gradlew.bat 放入模板目录\n` +
                    `  - ${projDir}\n` +
                    `  或在 buildTmp/google-play/proj/ 中添加 gradlew.bat`
                ));
                return;
            }

            // 4. Gradle clean：清理上次构建缓存，避免文件占用问题
            console.log(`[${taskName}] 执行 gradle clean...`);
            await runGradle(gradlewPath, projDir, 'clean', javaHome);

            // 5. Asset Pack 资源整理
            if(config.needAssetPack){
                prepareAssetPack(buildOutput, androidBuildType, taskName);
            }

            // 6. 执行 gradle 构建
            console.log(`  -------- Gradle 构建输出 --------`);
            await runGradle(gradlewPath, projDir, gradleTask, javaHome);
            console.log(`  -------- Gradle 构建结束 --------\n`);
            console.log(`[${taskName}] ✅ Android 构建完成\n`);

            // 上传 Android 构建产物
            const androidUploadPath = config.androidUploadPath;
            if (androidUploadPath) {
                const artifactFiles = findAndroidArtifacts(projDir, androidBuildType);
                if (artifactFiles.length > 0) {
                    try {
                        mkdirs(androidUploadPath);
                        for (const artifactFile of artifactFiles) {
                            const releaseName = config.androidReleaseName || path.basename(artifactFile, path.extname(artifactFile));
                            const ext = path.extname(artifactFile);
                            const destPath = path.join(androidUploadPath, releaseName + ext);
                            fs.copyFileSync(artifactFile, destPath);
                            console.log(`[${taskName}] 上传完成: ${artifactFile} → ${destPath}`);
                        }
                    } catch (err: any) {
                        console.error(`[${taskName}] ❌ Android 产物上传失败: ${err.message}`);
                        done(err);
                        return;
                    }
                } else {
                    console.log(`[${taskName}] ⚠ 未找到 Android 构建产物，跳过上传`);
                }
            }

            done();
        } catch (err: any) {
            console.error(`\n[${taskName}] ❌ Android 构建失败: ${err.message}\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

/**
 * 在 ${projDir}/build 下遍历查找 .aab 和 .apk 文件，
 * 根据 androidBuildType 决定上传哪些类型的产物。
 * 同类型有多个文件时，只保留最后修改的那个。
 */
function findAndroidArtifacts(projDir: string, androidBuildType: string): string[] {
    const type = androidBuildType.toUpperCase();
    const buildDir = path.join(projDir, 'build');
    if (!fs.existsSync(buildDir)) return [];

    // 按扩展名分组收集，记录最新修改时间的文件
    const latestByExt: Record<string, { path: string; mtime: number }> = {};

    walkDir(buildDir, (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        const extKey = ext.slice(1); // 去掉点号，如 '.aab' → 'aab'

        let shouldCollect = false;
        if (ext === '.aab' && (type === 'AAB' || type === 'BOTH')) {
            shouldCollect = true;
        } else if (ext === '.apk' && (type === 'APK' || type === 'BOTH')) {
            shouldCollect = true;
        }
        if (!shouldCollect) return;

        const mtime = fs.statSync(filePath).mtimeMs;
        const existing = latestByExt[extKey];
        if (!existing || mtime > existing.mtime) {
            latestByExt[extKey] = { path: filePath, mtime };
        }
    });

    return Object.values(latestByExt).map(v => v.path);
}

/** 递归遍历目录，对每个文件调用 callback */
function walkDir(dir: string, callback: (filePath: string) => void): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, callback);
        } else if (entry.isFile()) {
            callback(fullPath);
        }
    }
}

/** 清理 native/engine/{platform}/res/ 下的所有 .png 文件 */
function cleanNativeResPng(platform: string, taskName: string): void {
    const resDir = path.join(ROOT, 'native', 'engine', platform, 'res');
    if (!fs.existsSync(resDir)) {
        console.log(`[${taskName}] native res 目录不存在: ${resDir}`);
        return;
    }
    const pngFiles = findPngFiles(resDir);
    if (pngFiles.length === 0) {
        console.log(`[${taskName}] native res 目录下无 .png 文件`);
        return;
    }
    for (const f of pngFiles) {
        fs.unlinkSync(f);
    }
    console.log(`[${taskName}] 已清理 native res 目录，删除 ${pngFiles.length} 个 .png 文件`);
}

/** 递归查找目录下所有 .png 文件 */
function findPngFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findPngFiles(fullPath));
        } else if (entry.name.endsWith('.png')) {
            results.push(fullPath);
        }
    }
    return results;
}

/** AAB/APK 产物中需要移入 assetPack 的资源目录名 */
const ASSET_PACK_DIRS = ['assets', 'jsb-adapter', 'src'];

/**
 * 整理 Asset Pack 资源：
 * 1. 清理 proj/assetPack/src/main/assets/ 下的旧资源目录
 * 2. AAB 模式：将 buildOutput/assets/ 下的资源目录移动到 assetPack 中
 */
function prepareAssetPack(buildOutput: string, androidBuildType: string, taskName: string): void {
    const assetPackAssetsDir = path.join(buildOutput, 'proj', 'assetPack', 'src', 'main', 'assets');
    const buildAssetsDir = path.join(buildOutput, 'assets');

    console.log(`[${taskName}] 整理 Asset Pack 资源...`);

    // 1. 清理 assetPack 下的旧资源目录
    for (const dirName of ASSET_PACK_DIRS) {
        const dirPath = path.join(assetPackAssetsDir, dirName);
        if (fs.existsSync(dirPath)) {
            removeDir(dirPath);
            console.log(`  已删除: proj/assetPack/src/main/assets/${dirName}`);
        }
    }

    // 2. AAB 模式：将 buildOutput/assets/ 下的资源移入 assetPack
    if (androidBuildType.toUpperCase() === 'AAB') {
        if (!fs.existsSync(buildAssetsDir)) {
            console.log(`  buildOutput/assets 目录不存在，跳过资源移动`);
            return;
        }
        mkdirs(assetPackAssetsDir);
        for (const dirName of ASSET_PACK_DIRS) {
            const srcPath = path.join(buildAssetsDir, dirName);
            const destPath = path.join(assetPackAssetsDir, dirName);
            if (fs.existsSync(srcPath)) {
                fs.renameSync(srcPath, destPath);
                console.log(`  已移动: assets/${dirName} → proj/assetPack/src/main/assets/${dirName}`);
            }
        }
    }
}

/** 递归删除目录 */
function removeDir(dir: string): void {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            removeDir(fullPath);
        } else {
            fs.unlinkSync(fullPath);
        }
    }
    fs.rmdirSync(dir);
}

/** "AAB" / "APK" / "Both" → Gradle 任务名，未知值返回 null */
function mapBuildType(type: string): string | null {
    switch (type.toUpperCase()) {
        case 'AAB': return 'bundleRelease';
        case 'APK': return 'assembleRelease';
        case 'BOTH': return 'bundleRelease assembleRelease';
        default: return null;
    }
}

/** 生成 local.properties，写入 sdk.dir */
function writeLocalProperties(projDir: string, androidHome: string, taskName: string): void {
    const localPropsPath = path.join(projDir, 'local.properties');
    const content = `sdk.dir=${androidHome.replace(/\\/g, '\\\\')}\n`;
    fs.writeFileSync(localPropsPath, content, 'utf-8');
    console.log(`[${taskName}] 已生成 local.properties`);
}

/**
 * 查找 gradlew.bat，按优先级：
 * 1. proj/gradlew.bat
 * 2. 从 gradle.properties 中读取 NATIVE_DIR，使用其下的 gradlew.bat
 * 3. 返回 null 表示未找到
 */
function findGradlew(projDir: string, taskName: string): string | null {
    // 优先：proj 目录下直接有
    const localGradlew = path.join(projDir, 'gradlew.bat');
    if (fs.existsSync(localGradlew)) {
        console.log(`[${taskName}] 使用 gradlew: ${localGradlew}`);
        return localGradlew;
    }

    // 备选：从 gradle.properties 读取 NATIVE_DIR
    const gradlePropsPath = path.join(projDir, 'gradle.properties');
    if (fs.existsSync(gradlePropsPath)) {
        const content = fs.readFileSync(gradlePropsPath, 'utf-8');
        const match = content.match(/^NATIVE_DIR=(.+)$/m);
        if (match) {
            const nativeDir = match[1].trim();
            const nativeGradlew = path.join(nativeDir, 'gradlew.bat');
            if (fs.existsSync(nativeGradlew)) {
                console.log(`[${taskName}] 使用 gradlew: ${nativeGradlew}`);
                return nativeGradlew;
            }
        }
    }

    console.log(`[${taskName}] gradlew.bat 未找到`);
    return null;
}

/**
 * 执行 gradlew.bat，实时输出 stdout/stderr。
 * 失败时从累积输出中提取错误信息。
 */
function runGradle(
    gradlewPath: string,
    projDir: string,
    buildType: string,
    javaHome: string,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const env = { ...process.env };
        if (javaHome) {
            env['JAVA_HOME'] = javaHome;
        }

        const child = spawn(gradlewPath, [buildType], {
            cwd: projDir,
            env,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
        });

        let output = '';

        child.stdout.on('data', (data: Buffer) => {
            const text = data.toString();
            output += text;
            process.stdout.write(data);
        });
        child.stderr.on('data', (data: Buffer) => {
            const text = data.toString();
            output += text;
            process.stderr.write(data);
        });

        if (child.stdin) {
            child.stdin.write('\r\n');
            child.stdin.end();
        }

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                // 从输出中提取 FAILURE 相关信息
                const lines = output.split(/\r?\n/);
                const errors = lines.filter(l =>
                    /FAILURE|error|Error|FAILED|What went wrong|execution failed/i.test(l)
                );
                const detail = errors.length > 0
                    ? errors.slice(-10).join('\n  ')
                    : '(无详细错误信息，查看上方 Gradle 输出)';
                reject(new Error(
                    `Gradle 退出码: ${code}\n` +
                    `  报告: ${path.join(projDir, 'build', 'reports', 'problems', 'problems-report.html')}\n` +
                    `  ${detail}`
                ));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`无法启动 Gradle: ${err.message}`));
        });
    });
}
