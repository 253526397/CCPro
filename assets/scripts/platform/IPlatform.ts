export interface IAdAPI {
  /** 播放激励视频，返回是否完整观看 */
  showRewardedVideo(placement: string): Promise<boolean>;
  /** 显示插屏广告 */
  showInterstitial(placement: string): Promise<void>;
}

export interface IIAPAPI {
  /** 查询商品列表 */
  fetchProducts(productIds: string[]): Promise<ProductInfo[]>;
  /** 发起购买 */
  purchase(productId: string): Promise<PurchaseResult>;
  /** 恢复购买 */
  restorePurchases(): Promise<PurchaseResult[]>;
}

export interface IAuthAPI {
  /** 登录，返回 token */
  login(): Promise<AuthResult>;
  /** 登出 */
  logout(): Promise<void>;
  /** 是否已登录 */
  isLoggedIn(): boolean;
  /** 获取用户信息 */
  getUserInfo(): UserInfo | null;
}

export interface IShareAPI {
  /** 分享，返回是否成功 */
  share(options: ShareOptions): Promise<boolean>;
}

export interface IStorageAPI {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
}

export interface IPlatform {
  getPlatformId(): PlatformId;
  getAdAPI(): IAdAPI;
  getIAPAPI(): IIAPAPI;
  getAuthAPI(): IAuthAPI;
  getShareAPI(): IShareAPI;
  getStorageAPI(): IStorageAPI;
  getDeviceInfo(): DeviceInfo;
  init(): Promise<void>;
}

export type PlatformId = 'app' | 'h5' | 'wechat' | 'douyin';

export interface ProductInfo {
  productId: string;
  price: string;
  currency: string;
  title: string;
}

export interface PurchaseResult {
  productId: string;
  transactionId: string;
  success: boolean;
}

export interface AuthResult {
  token: string;
  userId: string;
}

export interface UserInfo {
  userId: string;
  nickname: string;
  avatar: string;
}

export interface ShareOptions {
  title: string;
  imageUrl?: string;
  query?: string;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  deviceModel: string;
}
