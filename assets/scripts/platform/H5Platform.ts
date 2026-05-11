import type {
  IPlatform, IAdAPI, IIAPAPI, IAuthAPI,
  IShareAPI, IStorageAPI, PlatformId, DeviceInfo,
} from './IPlatform';

class H5StorageAPI implements IStorageAPI {
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

export class H5Platform implements IPlatform {
  private storage: IStorageAPI = new H5StorageAPI();

  getPlatformId(): PlatformId { return 'h5'; }

  getAdAPI(): IAdAPI {
    throw new Error('AdAPI not implemented for H5');
  }

  getIAPAPI(): IIAPAPI {
    throw new Error('IAPAPI not implemented for H5');
  }

  getAuthAPI(): IAuthAPI {
    throw new Error('AuthAPI not implemented for H5');
  }

  getShareAPI(): IShareAPI {
    throw new Error('ShareAPI not implemented for H5');
  }

  getStorageAPI(): IStorageAPI {
    return this.storage;
  }

  getDeviceInfo(): DeviceInfo {
    return { platform: 'h5', osVersion: '', deviceModel: '' };
  }

  async init(): Promise<void> {}
}
