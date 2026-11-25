/**
 * 热更新资源清单 (manifest) 生成任务
 *
 * 递归扫描 Cocos Creator 构建产物 (src / assets / jsb-adapter)，
 * 计算每个文件的 size + md5，生成:
 *   - project.manifest  (完整资源清单，含 assets 与 searchPaths)
 *   - version.manifest  (版本清单，仅版本号与远端地址)
 *
 * 用法:
 *   npx gulp versionGenerator --url http://xxx/remote-assets/ --version 1.0.0 --src ./jsb/ --dest ./remote-assets/
 *
 * 参数 (均支持长参数与短参数):
 *   --url / -u       远端资源地址 (需以 / 结尾)
 *   --version / -v   版本号
 *   --src / -s       构建产物目录
 *   --dest / -d      manifest 输出目录
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { mkdirs } from '../utils/crypto';

// ============================================================
// 类型定义
// ============================================================

/** 单个资源的清单信息 */
interface IAssetInfo {
    size: number;
    md5: string;
    /** 是否压缩 (.zip) */
    compressed?: boolean;
}

/** 热更新清单结构 */
interface IManifest {
    packageUrl: string;
    remoteManifestUrl: string;
    remoteVersionUrl: string;
    version: string;
    assets: Record<string, IAssetInfo>;
    searchPaths: string[];
}

/** 版本生成参数 */
interface IVersionGeneratorOptions {
    url?: string;
    version?: string;
    src?: string;
    dest?: string;
}

// ============================================================
// 常量
// ============================================================

const DEFAULT_URL = 'http://localhost/tutorial-hot-update/remote-assets/';
const DEFAULT_VERSION = '1.0.0';
const DEFAULT_SRC = './jsb/';
const DEFAULT_DEST = './remote-assets/';

/** 需要扫描的资源子目录 */
const ASSET_SUBDIRS = ['src', 'assets', 'jsb-adapter'];

/** 完整清单文件名 */
const PROJECT_MANIFEST_NAME = 'project.manifest';

/** 版本清单文件名 */
const VERSION_MANIFEST_NAME = 'version.manifest';

// ============================================================
// 任务工厂
// ============================================================

/**
 * 创建热更新 manifest 生成任务
 *
 * @param opts 可选参数覆盖 (未传时从命令行读取，命令行再未传则使用默认值)
 */
export function createVersionGeneratorTask(opts?: IVersionGeneratorOptions): TaskFunction {
    const taskName = 'versionGenerator';

    const task: TaskFunction = (done) => {
        const args = { ...parseArgs(), ...(opts ?? {}) };

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始生成热更新 manifest`);
        console.log(`[${taskName}] 版本: ${args.version}`);
        console.log(`[${taskName}] 远端地址: ${args.url}`);
        console.log(`[${taskName}] 源目录: ${args.src}`);
        console.log(`[${taskName}] 输出目录: ${args.dest}`);
        console.log(`========================================\n`);

        try {
            // 构建完整清单
            const manifest: IManifest = {
                packageUrl: args.url,
                remoteManifestUrl: args.url + PROJECT_MANIFEST_NAME,
                remoteVersionUrl: args.url + VERSION_MANIFEST_NAME,
                version: args.version,
                assets: {},
                searchPaths: [],
            };

            // 递归扫描各资源子目录
            for (const sub of ASSET_SUBDIRS) {
                readDir(path.join(args.src, sub), manifest.assets, args.src);
            }

            const assetCount = Object.keys(manifest.assets).length;
            if (assetCount === 0) {
                console.warn(`[${taskName}] ⚠️ 未扫描到任何资源文件，请确认 --src 目录是否正确`);
            }
            console.log(`[${taskName}] 扫描到 ${assetCount} 个资源文件`);

            // 确保输出目录存在
            mkdirs(args.dest);

            // 写入完整清单
            const destManifest = path.join(args.dest, PROJECT_MANIFEST_NAME);
            fs.writeFileSync(destManifest, JSON.stringify(manifest));
            console.log(`[${taskName}] 已生成: ${destManifest}`);

            // 版本清单：去除 assets 与 searchPaths
            const versionManifest: Partial<IManifest> = { ...manifest };
            delete versionManifest.assets;
            delete versionManifest.searchPaths;

            const destVersion = path.join(args.dest, VERSION_MANIFEST_NAME);
            fs.writeFileSync(destVersion, JSON.stringify(versionManifest));
            console.log(`[${taskName}] 已生成: ${destVersion}`);

            console.log(`\n[${taskName}] ✅ manifest 生成完成\n`);
            done();
        } catch (err: any) {
            console.error(`\n========================================`);
            console.error(`[${taskName}] ❌ manifest 生成失败`);
            console.error(`  错误: ${err.message}`);
            console.error(`========================================\n`);
            done(err);
        }
    };

    task.displayName = taskName;
    return task;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 解析命令行参数
 *
 * 支持 --key value 与 -k value 两种格式，未传则使用默认值。
 */
function parseArgs(): Required<IVersionGeneratorOptions> {
    const result: Required<IVersionGeneratorOptions> = {
        url: DEFAULT_URL,
        version: DEFAULT_VERSION,
        src: DEFAULT_SRC,
        dest: DEFAULT_DEST,
    };

    const args = process.argv.slice(2);
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        const next = args[i + 1];

        switch (arg) {
            case '--url':
            case '-u':
                if (next !== undefined) {
                    result.url = next;
                    i += 2;
                } else {
                    i++;
                }
                break;
            case '--version':
            case '-v':
                if (next !== undefined) {
                    result.version = next;
                    i += 2;
                } else {
                    i++;
                }
                break;
            case '--src':
            case '-s':
                if (next !== undefined) {
                    result.src = next;
                    i += 2;
                } else {
                    i++;
                }
                break;
            case '--dest':
            case '-d':
                if (next !== undefined) {
                    result.dest = next;
                    i += 2;
                } else {
                    i++;
                }
                break;
            default:
                i++;
                break;
        }
    }

    return result;
}

/**
 * 递归扫描目录，计算文件 size + md5 并写入清单
 *
 * @param dir 待扫描目录
 * @param assets 清单资源表 (就地填充)
 * @param src 资源根目录 (用于计算相对路径)
 */
function readDir(dir: string, assets: Record<string, IAssetInfo>, src: string): void {
    if (!fs.existsSync(dir)) {
        return;
    }

    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) {
        return;
    }

    for (const name of fs.readdirSync(dir)) {
        // 跳过隐藏文件
        if (name.startsWith('.')) {
            continue;
        }

        const subpath = path.join(dir, name);
        const subStat = fs.statSync(subpath);

        if (subStat.isDirectory()) {
            readDir(subpath, assets, src);
        } else if (subStat.isFile()) {
            // 相对路径统一为 / 分隔并 URL 编码
            let relative = path.relative(src, subpath);
            relative = relative.replace(/\\/g, '/');
            relative = encodeURI(relative);

            const info: IAssetInfo = {
                size: subStat.size,
                md5: crypto.createHash('md5').update(fs.readFileSync(subpath)).digest('hex'),
            };

            if (path.extname(subpath).toLowerCase() === '.zip') {
                info.compressed = true;
            }

            assets[relative] = info;
        }
    }
}
