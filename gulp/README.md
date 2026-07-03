# Gulp 构建系统

基于 Gulp 的 Cocos Creator 项目自动化构建流水线。

## 快速开始

```bash
# 编译 gulp 项目（TS → JS）
npm run build:gulp

# 完整构建（指定配置名）
npx gulp pack --config dev
npx gulp pack --config release
```

## 预定义任务

| 命令 | 说明 |
|------|------|
| `npx gulp buildRelease` | 生产构建（使用 `release.json5`） |
| `npx gulp buildDev` | 开发构建（使用 `dev.json5`） |
| `npx gulp exportDevConfig` | 仅导出配置表 |
| `npx gulp compressassetsimage` | 仅压缩图片 |

## 构建流程

`pack` 任务按顺序执行以下 8 个步骤，各步骤由配置文件中的对应字段控制（为空则跳过）：

| 步骤 | 任务 | 说明 |
|------|------|------|
| 1 | **模板替换** | `templateFile` 目录下的文件按相对路径一对一覆盖到项目根目录 |
| 2 | **远端资源同步** | 将 `remoteRes` 目录同步到 `localRemoteRes` |
| 3 | **图片压缩** | 调用 `compressAssetsImage` 指定的外部工具压缩图片 |
| 4 | **配置表打包** | 拷贝源文件 → 执行导表 exe → 合并 JSON → 加密输出 `.dat` |
| 5 | **Cocos 构建** | 通过命令行调用 `CocosCreator.exe` 执行构建 |
| 6 | **构建后模板替换** | `buildTemplatePath/{platform}/` 下的文件一对一覆盖到构建产物目录 |
| 7 | **Android 打包** | 仅 `google-play` 平台，通过 Gradle 打出 AAB / APK |
| 8 | **FTP 上传** | 将目标文件或者文件夹通过 FTP/FTPS 上传到指定服务器 |

## 配置文件

配置文件位于 `gulpBuild/<name>.json5`，使用 JSON5 格式。

### 路径约定

- 以 `project://` 开头的路径会被替换为项目根目录
- `${ENV_VAR}` 格式的占位符会被替换为对应的环境变量值
- 空字符串表示跳过对应步骤

### 主要字段

| 字段 | 说明 |
|------|------|
| `configPath` | Excel/CSV 导出的原始配置目录 |
| `configOutput` | 配置表打包输出目录 |
| `configOutputSuffix` | 输出文件后缀（如 `.dat`、`.json`） |
| `encrypt` | 是否加密配置表 |
| `templateFile` | 构建前模板目录 |
| `buildTemplatePath` | 构建后模板目录 |
| `remoteRes` / `localRemoteRes` | 远端资源同步的源/目标路径 |
| `compressAssetsImage` | 图片压缩工具路径 |
| `creatorPath` | CocosCreator.exe 绝对路径 |
| `buildConfigPath` | Cocos Creator 构建配置 JSON 路径 |
| `platform` | 目标平台（`web-mobile`、`google-play`、`wechatgame` 等） |
| `androidBuildType` | Android 构建类型：`AAB`、`APK`、`Both` |
| `configUploadPath` | 配置表上传目标目录 |
| `buildUploadPath` | 构建产物上传目标目录 |
| `androidUploadPath` | Android 产物上传目标目录 |
| `ftpHost` / `ftpUser` / `ftpPassword` | FTP 上传配置 |
| `ftpSecure` | `true` 使用 FTPS，否则普通 FTP |

### 环境变量

- `SKIP_EXCEL=true` — 跳过配置表打包步骤

## 目录结构

```
gulp/
├── src/
│   ├── index.ts              # 任务入口 & 流水线定义
│   ├── tasks/
│   │   ├── applyTemplate.ts      # 构建前模板替换
│   │   ├── syncRemoteRes.ts      # 远端资源同步
│   │   ├── compressAssets.ts     # 图片压缩
│   │   ├── configPack.ts         # 配置表打包（导表 → 合并 → 加密）
│   │   ├── cocosBuild.ts         # Cocos Creator 命令行构建
│   │   ├── applyBuildTemplate.ts # 构建后模板替换 & google-play 后处理
│   │   ├── androidBuild.ts       # Android Gradle 打包
│   │   └── ftpUpload.ts          # FTP/FTPS 上传
│   ├── types/
│   │   └── buildConfig.ts        # 配置类型定义
│   └── utils/
│       ├── argv.ts               # 命令行参数解析
│       ├── configLoader.ts       # 配置加载 & 规范化
│       ├── crypto.ts             # AES 加密 & pako 压缩
│       ├── execUtils.ts          # 外部进程执行
│       ├── fileUtils.ts          # 文件操作
│       └── paths.ts              # 路径常量
├── dist/                     # 编译产物
└── tsconfig.json
```
