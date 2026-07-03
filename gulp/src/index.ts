import { series, TaskFunction } from 'gulp';

// 导入任务工厂
import { createAndroidBuildTask } from './tasks/androidBuild';
import { createApplyAndroidBuildTemplateTask } from './tasks/applyAndroidBuildTemplate';
import { createApplyTemplateTask } from './tasks/applyTemplate';
import { createCocosBuildTask } from './tasks/cocosBuild';
import { createCompressAssetsTask } from './tasks/compressAssets';
import { createPackConfigTablesTask } from './tasks/configPack';
import { createSyncRemoteResTask } from './tasks/syncRemoteRes';
import { createFtpUploadTask } from './tasks/ftpUpload';
import { getArgv } from './utils/argv';

// ============================================================
// Gulp 任务 (只导出 TaskFunction，避免工具函数污染任务列表)
// ============================================================


/**创建模板文件替换任务*/
export const replace: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[replace] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp replace --config <name>\n' +
            '示例: gulp replace --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    createApplyTemplateTask(configName)(done);
};

/**创建远端资源同步任务*/
export const syncRemoteRes: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[syncRemoteRes] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp syncRemoteRes --config <name>\n' +
            '示例: gulp syncRemoteRes --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    createSyncRemoteResTask(configName)(done);
}

/**创建图片压缩任务*/
export const compress: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[compress] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp compress --config <name>\n' +
            '示例: gulp compress --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    createCompressAssetsTask(configName)(done);
}

/**创建配置表打包任务*/
export const configPack: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[configPack] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp configPack --config <name>\n' +
            '示例: gulp configPack --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    createPackConfigTablesTask(configName)(done);
}

/**创建 Cocos Creator 构建任务*/
export const cocosBuild: TaskFunction = (done) => {
    const configName = getArgv('config');
    
    if (!configName) {
        console.error(
            '[cocosBuild] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp cocosBuild --config <name>\n' +
            '示例: gulp cocosBuild --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    createCocosBuildTask(configName)(done);
}

/**android打包任务*/
export const androidBuild: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[androidBuild] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp androidBuild --config <name>\n' +
            '示例: gulp androidBuild --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    series(
        createApplyTemplateTask(configName),
        createApplyAndroidBuildTemplateTask(configName),
        createAndroidBuildTask(configName),
    )(done);
}

/**ftp上传任务*/
export const ftpUpload: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[ftpUpload] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp ftpUpload --config <name>\n' +
            '示例: gulp ftpUpload --config dev\n'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }
    createFtpUploadTask(configName)(done);
}

// ============================================================
// 通用任务：通过 --config 参数动态选择配置
// ============================================================

/**
 * 通用打包任务：通过命令行参数 --config 指定要使用的配置
 *
 * 流程: 模板替换 → 远端资源同步 → 图片压缩 → 配置表打包 → Cocos 构建 → 构建后模板替换 → Android 构建
 * 各步骤是否执行由 gulpBuild/<name>.json5 中的对应字段控制
 *
 * 用法:
 *   npx gulp pack --config dev          → 使用 dev.json5
 *   npx gulp pack --config release      → 使用 release.json5
 */
export const pack: TaskFunction = (done) => {
    const configName = getArgv('config');

    if (!configName) {
        console.error(
            '[pack] 错误: 请通过 --config 参数指定配置名称\n' +
            '用法: gulp pack --config <name>\n' +
            '示例: gulp pack --config dev\n' +
            '      gulp pack --config release'
        );
        done(new Error('缺少 --config 参数'));
        return;
    }

    series(
        createApplyTemplateTask(configName),
        createSyncRemoteResTask(configName),
        createCompressAssetsTask(configName),
        createPackConfigTablesTask(configName),
        createCocosBuildTask(configName),
        createApplyTemplateTask(configName),
        createApplyAndroidBuildTemplateTask(configName),
        createAndroidBuildTask(configName),
        createFtpUploadTask(configName),
    )(done);
};