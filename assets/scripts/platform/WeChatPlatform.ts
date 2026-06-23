import type{
  IPlatform, IAdAPI, IIAPAPI, IAuthAPI,
  IShareAPI, IStorageAPI, PlatformId, DeviceInfo,
} from './IPlatform';

class WeChatStorageAPI implements IStorageAPI {
  get(key: string): string | null {
    if (typeof wx !== 'undefined') {
      return wx.getStorageSync(key) || null;
    }
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    if (typeof wx !== 'undefined') {
      wx.setStorageSync(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  remove(key: string): void {
    if (typeof wx !== 'undefined') {
      wx.removeStorageSync(key);
    } else {
      localStorage.removeItem(key);
    }
  }

  clear(): void {
    if (typeof wx !== 'undefined') {
      wx.clearStorageSync();
    } else {
      localStorage.clear();
    }
  }
}

export class WeChatPlatform implements IPlatform {
  private storage: IStorageAPI = new WeChatStorageAPI();

  getPlatformId(): PlatformId { return 'wechat'; }

  getAdAPI(): IAdAPI {
    throw new Error('AdAPI not implemented for WeChat');
  }

  getIAPAPI(): IIAPAPI {
    throw new Error('IAPAPI not implemented for WeChat');
  }

  getAuthAPI(): IAuthAPI {
    throw new Error('AuthAPI not implemented for WeChat');
  }

  getShareAPI(): IShareAPI {
    throw new Error('ShareAPI not implemented for WeChat');
  }

  getStorageAPI(): IStorageAPI {
    return this.storage;
  }

  getDeviceInfo(): DeviceInfo {
    return { platform: 'wechat', osVersion: '', deviceModel: '' };
  }

  async init(): Promise<void> {}
}
