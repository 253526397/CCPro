import * as path from 'path';

/**
 * 工程根目录 (gulp/dist/ -> ../../ -> 项目根)
 */
export const ROOT = path.resolve(__dirname, '..', '..');

/**
 * gulp 工程目录
 */
export const GULP_DIR = path.join(ROOT, 'gulp');

/**
 * gulpBuild 配置目录 (存放不同环境的构建配置 JSON)
 */
export const GULP_BUILD_DIR = path.join(ROOT, 'gulpBuild');

/**
 * gulpBuildTemp 临时目录 (配置表打包的工作区)
 */
export const GULP_BUILD_TEMP_DIR = path.join(ROOT, 'gulpBuildTemp');
