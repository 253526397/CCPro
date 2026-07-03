import { ANDROID, BYTEDANCE, HTML5, IOS, WECHAT } from "cc/env";
import { StringUtil } from "./common/util/StringUtil";

// let args: Map<string, string> = new Map<string, string>();
// let query = (window?.location?.search ?? "").substring(1);
// let params = query.split("&");
// for (let i = 0; i < params.length; i++) {
//     let entry: string[] = params[i].split("=");
//     args.set(entry[0], entry[1]);
// }

export enum Platform {
    UNKNOWN,
    WECHAT,
    BYTEDANCE, // 国内 抖音/西瓜视频/今日头条
    TIKTOK, // 国际 TikTok
    KUAISHOU,
    BILI,
    TAPTAP,
    IOS,
    NATIVE, // android独立包, 预览版, 无广告, 无支付, 仅提审用
    TAPTAP_ANDROID,
    GOOGLE_PLAY,
}

export enum Flavor {
    Undefined = 0,
    BaoZouKuangChao = 500001,
    TanLeGeLong = 500002,
    KuaiCanTest = 999999,
}

/**打包的时候需要修改，最好把Env.ts添加在打包模板里面*/
let androidPlatform: Platform = Platform.GOOGLE_PLAY;

let debug: boolean = false;

let flavor: Flavor = Flavor.TanLeGeLong;
let resVersionTag: string = "/v20260618";

let platform: Platform = Platform.UNKNOWN;
let tagPlatform: string = "unknown";

let endpoint: string = "https://bzkc.jazpulse.com/";
let resEndpoint: string = "https://res.jazpulse.com/";

/**
 * FIXME 目前在运行时无法区分是 抖音 还是 Tiktok, 所以先临时加这么个常量, 打包前修改.
 */
export const BYTEDANCE_IS_TIKTOK: boolean = false;

if(IOS){
    platform = Platform.IOS;
}else if (ANDROID) {
    platform = androidPlatform;
    tagPlatform = "native";
} else if (BYTEDANCE) {
    if (BYTEDANCE_IS_TIKTOK) {
        platform = Platform.TIKTOK;
        tagPlatform = "tt";
        endpoint = "https://minibzkc.jazpulse.com/";
        // debug = true; 这里先去掉吧, 但支付尚未测试通过, 接下来的测试还要用
    } else {
        platform = Platform.BYTEDANCE;
        tagPlatform = "dy";
    }
    // @ts-ignore
} else if (globalThis?.ks) {
    platform = Platform.KUAISHOU;
    tagPlatform = "ks";
} else if (globalThis?.bl) {
    platform = Platform.BILI;
    tagPlatform = "bl";
} else if (WECHAT) {
    if (globalThis?.tap?.getSystemInfo) {
        platform = Platform.TAPTAP;
        tagPlatform = "tap";
    } else {
        platform = Platform.WECHAT;
        tagPlatform = "wx";
    }
} else {
    // 视为测试环境
    if (HTML5) {
        platform = Platform.UNKNOWN;

        let origin: string = window.location.origin;
        if (origin.includes("localhost") || origin.includes(":745")) {
            resEndpoint = "http://192.168.100.251/";
        } else {
            resEndpoint = `${origin}/`;
        }
        resVersionTag = "";
        tagPlatform = "web";
    }
}

let defaultTag: string = `bzkc_${tagPlatform}_${flavor}`;

if (platform == Platform.WECHAT) {
    // try {
    //     const accountInfo = globalThis.wx?.getAccountInfoSync();
    //     debug = accountInfo?.miniProgram?.envVersion === "develop";
    // } catch (e) { }
    // 微信审核不让上debug版
} else if (platform == Platform.BYTEDANCE) {
    try {
        let envType = globalThis.tt.getEnvInfoSync()?.microapp?.envType;
        debug = envType === "development";
    } catch (e) {
        console.warn("ENV ERROR ", e);
    }
} else if (platform == Platform.UNKNOWN) {
    defaultTag = `zumbia_${tagPlatform}_${flavor}`;
    debug = true;
}
export interface IEnv {
    secretKey: string;
    version: string;
    // args: Map<string, string>;
    debug: boolean;
    platform: Platform;
    endPoint: string;
    trackEndPoint: string;
    resEndpoint: string;
    tag: string;
    resUrl: string;
    flavor: Flavor;
    resVersionTag: string,
    sessionId: string;
}

let resUrl: string = `${resEndpoint}${defaultTag}${resVersionTag}`;

export const env: IEnv = {
    secretKey: "mandateofheaven",
    version: "0",
    // args: args,
    debug: debug,
    platform: platform,
    endPoint: endpoint,
    trackEndPoint: "https://dot.jazpulse.com/",
    resEndpoint: resEndpoint,
    tag: defaultTag,
    resUrl: resUrl,
    flavor: flavor,
    resVersionTag: resVersionTag,
    sessionId: StringUtil.generateUUID4(),
};