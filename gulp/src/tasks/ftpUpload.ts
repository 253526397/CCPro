import * as fs from 'fs';
import { TaskFunction } from 'gulp';
import * as path from 'path';
import { IBuildConfig } from '../types/buildConfig';
import { loadBuildConfig } from '../utils/configLoader';

/**
 * 创建 FTP 上传任务
 *
 * 将 ftpSourcePath 目录下的所有内容递归上传到 ftpDestPath。
 * 未配置 ftpSourcePath 或 ftpHost 则跳过。
 * 支持普通 FTP 和 FTPS（通过 ftpSecure 字段控制）。
 *
 * 依赖: npm install basic-ftp
 *
 * @param configName 构建配置文件名称
 */
export function createFtpUploadTask(configName: string): TaskFunction {
    const config: IBuildConfig = loadBuildConfig(configName);
    const taskName = `ftpUpload[${config.name}]`;

    const task: TaskFunction = async (done) => {
        const sourcePath = config.ftpSourcePath;
        const destPath = config.ftpDestPath;
        const host = config.ftpHost;

        if (!sourcePath || !host) {
            const reason = !sourcePath ? 'ftpSourcePath' : 'ftpHost';
            console.log(`[${taskName}] 未配置 ${reason}，跳过 FTP 上传`);
            done();
            return;
        }

        if (!fs.existsSync(sourcePath)) {
            console.error(`[${taskName}] ❌ FTP 上传源路径不存在: ${sourcePath}`);
            done(new Error(`FTP 上传源路径不存在: ${sourcePath}`));
            return;
        }

        // 动态导入 basic-ftp，未安装时给出友好提示
        let ftp: any;
        try {
            ftp = require('basic-ftp');
        } catch {
            console.error(
                `[${taskName}] ❌ 未安装 basic-ftp 依赖\n` +
                `  请执行: npm install basic-ftp\n` +
                `  或在项目根目录: npm install --save-dev basic-ftp`
            );
            done(new Error('缺少 basic-ftp 依赖'));
            return;
        }

        const port = config.ftpPort ? parseInt(config.ftpPort, 10) : 21;
        const secure = config.ftpSecure === true;
        const protocol = secure ? 'FTPS' : 'FTP';

        const client = new ftp.Client();
        client.ftp.verbose = true;

        console.log(`\n========================================`);
        console.log(`[${taskName}] 开始 FTP 上传`);
        console.log(`[${taskName}] 源路径: ${sourcePath}`);
        console.log(`[${taskName}] 目标路径: ${destPath}`);
        console.log(`[${taskName}] 服务器: ${protocol}://${host}:${port}`);
        console.log(`[${taskName}] 账号: ${config.ftpUser}`);
        console.log(`========================================\n`);

        try {
            await client.access({
                host,
                port,
                user: config.ftpUser || undefined,
                password: config.ftpPassword || undefined,
                secure,
                // 普通 FTP 使用明文传输，不需要安全选项
                secureOptions: secure ? { rejectUnauthorized: false } : undefined,
            });

            // 确保目标目录存在
            await client.ensureDir(destPath);

            // 判断源路径是文件还是目录
            const stat = fs.statSync(sourcePath);
            let uploadCount = 0;

            if (stat.isDirectory()) {
                // 上传整个目录
                await client.uploadFromDir(sourcePath);
                uploadCount = countFiles(sourcePath);
            } else {
                // 上传单个文件
                const fileName = path.basename(sourcePath);
                await client.uploadFrom(sourcePath, path.posix.join(destPath, fileName));
                uploadCount = 1;
            }

            console.log(`[${taskName}] ✅ FTP 上传完成，共 ${uploadCount} 个文件\n`);
        } catch (err: any) {
            console.error(`[${taskName}] ❌ FTP 上传失败: ${err.message}\n`);
            done(err);
            return;
        } finally {
            client.close();
        }

        done();
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
