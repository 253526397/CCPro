/**
 * 配置表加密/解密工具
 *
 * 加密流程: JSON 文本 → pako 压缩 → AES 加密 → .dat 文件
 * 解密流程: .dat 文件 → AES 解密 → pako 解压 → JSON 文本
 *
 * 客户端使用 crypto-es (ES module)，gulp 端使用 crypto-js (CommonJS)
 */
import * as fs from 'fs';
import * as path from 'path';
import * as pako from 'pako';
import CryptoJS from 'crypto-js';

/** 加密密钥 */
const ENCRYPTION_KEY = 'mandateofheaven';

// ============================================================
// 底层加解密
// ============================================================

/** AES 加密 */
function encryptStringAES(plainText: string, secretKey: string): string {
    return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/** AES 解密 */
function decryptStringAES(cipherText: string, secretKey: string): string {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// ============================================================
// 压缩/解压
// ============================================================

/** pako 压缩后转 base64 */
function compressString(input: string): string {
    const compressed = pako.deflate(input);
    return Buffer.from(compressed).toString('base64');
}

/** base64 解码后 pako 解压 */
function decompressString(compressed: string): string {
    const decoded = Buffer.from(compressed, 'base64');
    const decompressed = pako.inflate(decoded, { to: 'string' });
    return decompressed;
}

// ============================================================
// 组合操作
// ============================================================

/** 压缩 + 加密 */
export function secureString(input: string, secretKey: string = ENCRYPTION_KEY): string {
    const compressed = compressString(input);
    return encryptStringAES(compressed, secretKey);
}

/** 解密 + 解压 */
export function retrieveString(secureInput: string, secretKey: string = ENCRYPTION_KEY): string {
    const decrypted = decryptStringAES(secureInput, secretKey);
    return decompressString(decrypted);
}

// ============================================================
// 目录级别操作
// ============================================================

/**
 * 加密目录下所有 JSON 文件，输出为 .dat 文件
 *
 * @param directory 源目录 (包含 .json 文件)
 * @param outputDirectory 输出目录 (生成 .dat 文件)
 */
export function encryptJsonFiles(directory: string, outputDirectory: string): void {
    if (!fs.existsSync(directory)) {
        console.warn(`[crypto] 源目录不存在: ${directory}`);
        return;
    }

    mkdirs(outputDirectory);

    const jsonFiles = fs.readdirSync(directory).filter(file => file.endsWith('.json'));
    console.log(`[crypto] 找到 ${jsonFiles.length} 个 JSON 文件待加密`);

    jsonFiles.forEach(jsonFile => {
        const filePath = path.join(directory, jsonFile);
        const text = fs.readFileSync(filePath, 'utf-8');
        const encrypted = secureString(text, ENCRYPTION_KEY);
        const outputPath = path.join(outputDirectory, jsonFile.replace('.json', '.dat'));
        fs.writeFileSync(outputPath, encrypted, 'utf-8');
        console.log(`[crypto] 已加密: ${jsonFile} → ${path.basename(outputPath)}`);
    });

    console.log(`[crypto] 加密完成，共处理 ${jsonFiles.length} 个文件`);
}

/**
 * 加密单个 JSON 文件，输出为指定文件名
 *
 * @param inputPath 源 JSON 文件路径
 * @param outputPath 输出文件完整路径 (含自定义文件名和后缀)
 */
export function encryptJsonFile(inputPath: string, outputPath: string): void {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`源文件不存在: ${inputPath}`);
    }

    mkdirs(path.dirname(outputPath));

    const text = fs.readFileSync(inputPath, 'utf-8');
    const encrypted = secureString(text, ENCRYPTION_KEY);
    fs.writeFileSync(outputPath, encrypted, 'utf-8');
    console.log(`[crypto] 已加密: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
}

/**
 * 解密目录下所有 .dat 文件，输出为 .json 文件
 *
 * @param directory 源目录 (包含 .dat 文件)
 * @param outputDirectory 输出目录 (生成 .json 文件)
 */
export function decryptJsonFiles(directory: string, outputDirectory: string): void {
    if (!fs.existsSync(directory)) {
        console.warn(`[crypto] 源目录不存在: ${directory}`);
        return;
    }

    mkdirs(outputDirectory);

    const datFiles = fs.readdirSync(directory).filter(file => file.endsWith('.dat'));
    console.log(`[crypto] 找到 ${datFiles.length} 个 DAT 文件待解密`);

    datFiles.forEach(datFile => {
        const filePath = path.join(directory, datFile);
        const text = fs.readFileSync(filePath, 'utf-8');
        const decrypted = retrieveString(text, ENCRYPTION_KEY);
        const outputPath = path.join(outputDirectory, datFile.replace('.dat', '.json'));
        fs.writeFileSync(outputPath, decrypted, 'utf-8');
        console.log(`[crypto] 已解密: ${datFile} → ${path.basename(outputPath)}`);
    });

    console.log(`[crypto] 解密完成，共处理 ${datFiles.length} 个文件`);
}

// ============================================================
// 工具
// ============================================================

/** 递归创建目录 */
export function mkdirs(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
