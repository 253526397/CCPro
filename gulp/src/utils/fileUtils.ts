/**
 * 文件操作工具
 */
import * as fs from 'fs';
import * as path from 'path';
import { mkdirs } from './crypto';

/**
 * 递归复制目录
 *
 * @param srcDir 源目录
 * @param destDir 目标目录
 * @param overwrite 是否覆盖已存在的文件 (默认 true)
 */
export function copyDirectory(srcDir: string, destDir: string, overwrite: boolean = true): void {
    if (!fs.existsSync(srcDir)) {
        throw new Error(`源目录不存在: ${srcDir}`);
    }

    mkdirs(destDir);

    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, overwrite);
        } else {
            if (!overwrite && fs.existsSync(destPath)) {
                continue;
            }
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 递归删除目录
 */
export function removeDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
        return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            removeDirectory(fullPath);
        } else {
            fs.unlinkSync(fullPath);
        }
    }

    fs.rmdirSync(dir);
}

/**
 * 上传目录：将源目录内容完整拷贝到目标目录。
 * 先尝试清理目标目录（失败则降级为覆盖模式），再拷贝。
 *
 * @param srcDir 源目录
 * @param destDir 目标目录
 * @param taskName 任务名 (用于日志)
 * @returns 拷贝的文件数量
 */
export function uploadDirectory(srcDir: string, destDir: string, taskName: string): number {
    if (!fs.existsSync(srcDir)) {
        throw new Error(`源目录不存在: ${srcDir}`);
    }

    // 尝试清理目标目录，失败则降级为直接覆盖
    try {
        removeDirectory(destDir);
    } catch (_) {
        console.log(`[${taskName}] 目标目录清理失败（可能被占用），降级为覆盖模式`);
    }
    mkdirs(destDir);
    copyDirectory(srcDir, destDir);

    const count = countFiles(destDir);
    console.log(`[${taskName}] 上传完成: ${srcDir} → ${destDir}，共 ${count} 个文件`);
    return count;
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

/**
 * 在目录中查找指定扩展名的文件
 *
 * @param dir 搜索目录
 * @param ext 扩展名 (如 '.exe', '.json')
 * @returns 匹配的文件名数组
 */
export function findFilesByExt(dir: string, ext: string): string[] {
    if (!fs.existsSync(dir)) {
        return [];
    }

    return fs.readdirSync(dir)
        .filter(f => f.endsWith(ext));
}
