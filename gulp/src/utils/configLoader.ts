import * as fs from 'fs';
import JSON5 from 'json5';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { GULP_BUILD_DIR, ROOT } from './paths';

/**
 * 加载指定名称的构建配置
 *
 * @param name 配置名称 (不含后缀)，如 'dev', 'release'
 * @returns 解析并规范化后的构建配置对象
 * @throws 如果配置文件不存在
 *
 * @example
 * const config = loadBuildConfig('dev');
 * // => { name: 'dev', configPath: '...', configOutput: '...' }
 */
export function loadBuildConfig(name: string): IBuildConfig {
    const configPath = findConfigFile(name);

    if (!configPath) {
        throw new Error(
            `[configLoader] 构建配置文件不存在: ${name}.json5\n` +
            `搜索目录: ${GULP_BUILD_DIR}\n` +
            `可用的配置文件: ${listAvailableConfigs().join(', ')}`
        );
    }

    const raw = JSON5.parse(fs.readFileSync(configPath, 'utf-8'));

    return normalizeConfig(name, raw);
}

/**
 * 列出 gulpBuild/ 目录下所有可用的配置名称
 */
export function listAvailableConfigs(): string[] {
    if (!fs.existsSync(GULP_BUILD_DIR)) {
        return [];
    }

    return fs.readdirSync(GULP_BUILD_DIR)
        .filter(f => f.endsWith('.json5') || f.endsWith('.json'))
        .map(f => path.basename(f, f.endsWith('.json5') ? '.json5' : '.json'));
}

/**
 * 根据名称查找配置文件，优先找 .json5，其次 .json
 */
function findConfigFile(name: string): string | null {
    const json5Path = path.join(GULP_BUILD_DIR, `${name}.json5`);
    if (fs.existsSync(json5Path)) {
        return json5Path;
    }

    const jsonPath = path.join(GULP_BUILD_DIR, `${name}.json`);
    if (fs.existsSync(jsonPath)) {
        return jsonPath;
    }

    return null;
}

/**
 * 递归替换对象中所有字符串值的 ${ENV_VAR} 为对应环境变量值
 */
function substituteEnvVars(obj: any): any {
    if (typeof obj === 'string') {
        return obj.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || '');
    }
    if (Array.isArray(obj)) {
        return obj.map(substituteEnvVars);
    }
    if (obj && typeof obj === 'object') {
        const result: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
            result[key] = substituteEnvVars(obj[key]);
        }
        return result;
    }
    return obj;
}

/**
 * 规范化原始 JSON 数据，补全字段、修正拼写错误
 */
function normalizeConfig(name: string, raw: Record<string, any>): IBuildConfig {
    // 替换配置值中的 ${ENV_VAR} 环境变量
    raw = substituteEnvVars(raw);

    // 解析路径：project:// 前缀替换为项目根目录，绝对路径保持不变
    const resolvePath = (v: string) => v ? v.replace(/^project:\/\//, ROOT + path.sep) : '';

    // 解析 buildConfigPath 指向的 Cocos Creator 构建配置，提取 platform 和 buildOutput
    let platform = '';
    let buildOutput = raw.buildOutput || '';
    let androidReleaseName = '';
    const buildConfigPath: string = resolvePath(raw.buildConfigPath);

    if (buildConfigPath && fs.existsSync(buildConfigPath)) {
        try {
            const buildConfigRaw = JSON.parse(fs.readFileSync(buildConfigPath, 'utf-8'));
            platform = buildConfigRaw.platform || '';
            androidReleaseName = buildConfigRaw.name || '';

            // 从构建配置中计算 buildOutput:
            // buildPath (将 project:// 替换为项目根目录) + outputName
            if (!buildOutput) {
                const bp: string = buildConfigRaw.buildPath || '';
                const on: string = buildConfigRaw.outputName || '';
                const resolvedBuildPath = bp.replace(/^project:\/\//, ROOT + path.sep);
                buildOutput = path.join(resolvedBuildPath, on);
            }
        } catch (e) {
            console.error(`[configLoader] 解析构建配置文件失败: ${buildConfigPath}`, e);
        }
    }

    return {
        name,
        configPath: raw.configPath || '',
        configPlatform: raw.configPlatform || '',
        templateFile: resolvePath(raw.templateFile),
        buildTemplatePath: resolvePath(raw.buildTemplatePath),
        remoteRes: raw.remoteRes || '',
        localRemoteRes: resolvePath(raw.localRemoteRes),
        configOutput: raw.configOutput || '',
        encrypt: raw.encrypt === true,
        configOutputSuffix: raw.configOutputSuffix || raw.configOutputName || '',
        compressAssetsImage: raw.compressassetsimage || raw.compressAssetsImage || '',
        creatorPath: raw.creatorPath || '',
        platform,
        buildConfigPath,
        buildOutput,
        configUploadPath: raw.configUploadPath || '',
        buildUploadPath: raw.buildUploadPath || '',
        androidUploadPath: raw.androidUploadPath || '',
        versionCode: raw.versionCode || '1',
        versionName: raw.versionName || '1.0',
        androidReleaseName,
        androidBuildType: raw.androidBuildType || '',
        needAssetPack: raw.needAssetPack === true,
        // FTP 上传配置
        ftpSourcePath: raw.ftpSourcePath || '',
        ftpDestPath: raw.ftpDestPath || '',
        ftpHost: raw.ftpHost || '',
        ftpPort: raw.ftpPort || '',
        ftpUser: raw.ftpUser || '',
        ftpPassword: raw.ftpPassword || '',
        ftpSecure: raw.ftpSecure === true,
    };
}
