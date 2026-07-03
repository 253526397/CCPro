/**
 * 构建配置接口
 * 对应 gulpBuild/ 目录下的 JSON 配置文件结构
 */
export interface IBuildConfig {
    /**
     * 构建配置名称 (如 dev, release)
     */
    name: string;

    /**
     * 配置表源路径 (Excel/CSV 导出的原始配置目录)
     */
    configPath: string;

    /**
     * 平台配置路径 (与 configPath 内容一同拷贝到临时目录)
     * 空字符串: 跳过
     */
    configPlatform: string;

    /**
     * 模板文件目录。目录下的文件按相对路径一对一替换到项目根目录，
     * 目标文件不存在则跳过。空字符串: 跳过。
     */
    templateFile: string;

    /**
     * 构建后模板路径。构建完成后，将 {buildTemplatePath}/{platform}/ 下的
     * 文件按相对路径一对一替换到 buildOutput 目录。
     * 空字符串: 跳过。
     */
    buildTemplatePath: string;

    /**
     * 远程资源路径 (源)，与 localRemoteRes 同时配置才执行同步
     * 空字符串: 跳过
     */
    remoteRes: string;

    /**
     * 本地远程资源路径 (目标)，与 remoteRes 同时配置才执行同步
     * 空字符串: 跳过
     */
    localRemoteRes: string;

    /**
     * 配置表输出路径 (打包后的配置输出目录)
     */
    configOutput: string;

    /**
     * 是否加密输出 (默认 false)
     */
    encrypt: boolean;

    /**
     * 输出文件名后缀 (含点)，如 ".dat"、".dat.txt"、".json"
     * 输出后 config 和 environment 文件会统一此后缀
     */
    configOutputSuffix: string;

    /**
     * 图片压缩工具路径
     * - 绝对路径: 直接使用
     * - 相对路径/文件名: 从项目根目录拼接
     * - 空字符串: 跳过图片压缩
     */
    compressAssetsImage: string;

    /**
     * Cocos Creator 可执行文件绝对路径
     * 如 "C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe"
     * 空字符串: 跳过 Cocos Creator 构建
     */
    creatorPath: string;

    /**
     * 目标平台 (从 buildConfigPath 指向的 Cocos Creator 构建配置中读取)
     * 如 "web-mobile"、"google-play"、"wechatgame"
     */
    platform: string;

    /**
     * Cocos Creator 构建配置 JSON 文件路径
     * 如 "C:/workspace_hj/huabuwan/build_config/buildConfig_web-mobile.json"
     */
    buildConfigPath: string;

    /**
     * Cocos Creator 构建产物输出路径
     * 由 buildConfigPath 指向的配置文件中的 buildPath + outputName 拼接而成
     */
    buildOutput: string;

    /**
     * 配置表打包后上传路径。将 configOutput 的内容上传到此目录。
     * 空字符串: 跳过。
     */
    configUploadPath: string;

    /**
     * Cocos Creator 构建后上传路径。将 buildOutput 的内容上传到此目录。
     * 空字符串: 跳过。
     */
    buildUploadPath: string;

    /**
     * Android 版本号 (整数)，每次打包自增 +1
     */
    versionCode: string;

    /**
     * Android 版本名称 (如 "1.14")，每次打包自增 +0.01
     */
    versionName: string;

    /**
     * Android 构建后上传路径。将 Android 构建产物（AAB/APK）上传到此目录。
     * 空字符串: 跳过。
     */
    androidUploadPath: string;

    /**
     * Android 产物发布名称 (从 buildConfigPath 指向的 JSON 中 name 字段读取)
     * 上传时产物文件将重命名为 ${androidReleaseName}.apk 或 .aab
     */
    androidReleaseName: string;

    /**
     * Android 构建类型 (仅 google-play 平台生效)
     * - "AAB": 构建 AAB (Android App Bundle)
     * - "APK": 构建 APK
     * - "Both": 同时构建 AAB + APK
     * - "": 跳过 Android 打包
     */
    androidBuildType: string;

    /**
     * 是否需要 Asset Pack (默认 false)
     * true: 自动修改 settings.gradle 添加 include ':assetPack'，
     *       并确保 assetPack/src/main/assets/ 非空
     */
    needAssetPack: boolean;

    // ============================================================
    // FTP 上传配置
    // ============================================================

    /**
     * FTP 上传源路径 (要上传的本地文件或目录)
     * 空字符串: 跳过 FTP 上传
     */
    ftpSourcePath: string;

    /**
     * FTP 目标路径 (服务器上的目标目录)
     */
    ftpDestPath: string;

    /**
     * FTP 服务器地址
     */
    ftpHost: string;

    /**
     * FTP 端口，默认 21
     */
    ftpPort: string;

    /**
     * FTP 用户名
     */
    ftpUser: string;

    /**
     * FTP 密码
     */
    ftpPassword: string;

    /**
     * 是否使用 FTPS (true = FTPS, false = 普通 FTP)
     */
    ftpSecure: boolean;
}
