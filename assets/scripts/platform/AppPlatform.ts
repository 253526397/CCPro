import {
  IPlatform, IAdAPI, IIAPAPI, IAuthAPI,
  IShareAPI, IStorageAPI, PlatformId, DeviceInfo,
} from './IPlatform';

class AppStorageAPI implements IStorageAPI {
  get(key: string): string | null {
    return localStorage.getItem(key);
  }
  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  remove(key: string): void {
    localStorage.removeItem(key);
  }
  clear(): void {
    localStorage.clear();
  }
}

export class AppPlatform implements IPlatform {
  private storage: IStorageAPI = new AppStorageAPI();

  getPlatformId(): PlatformId { return 'app'; }

  getAdAPI(): IAdAPI {
    throw new Error('AdAPI not implemented for app');
  }

  getIAPAPI(): IIAPAPI {
    throw new Error('IAPAPI not implemented for app');
  }

  getAuthAPI(): IAuthAPI {
    throw new Error('AuthAPI not implemented for app');
  }

  getShareAPI(): IShareAPI {
    throw new Error('ShareAPI not implemented for app');
  }

  getStorageAPI(): IStorageAPI {
    return this.storage;
  }

  getDeviceInfo(): DeviceInfo {
    return { platform: 'app', osVersion: '', deviceModel: '' };
  }

  async init(): Promise<void> {}
}
