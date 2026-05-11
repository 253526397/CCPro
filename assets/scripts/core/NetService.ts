import { EventBus } from './EventBus';
import { NetEvents } from '../events';

/** 标准服务端响应格式 */
export interface NetResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/** 失败自动重试次数 */
const MAX_RETRIES = 3;
/** 首次重试延迟 ms，后续指数递增 */
const RETRY_DELAY = 1000;

/**
 * HTTP 短连接服务，失败自动重试最多 3 次。
 * 适用于云存档、排行榜等弱联网场景。
 */
export class NetService {
  private static _inst: NetService;
  static get inst(): NetService {
    if (!this._inst) this._inst = new NetService();
    return this._inst;
  }

  private baseUrl: string = '';
  private bus: EventBus = new EventBus();

  /** 设置 API 根地址，如 "https://api.example.com" */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /** GET 请求 */
  async get<T = any>(path: string, params?: Record<string, string>): Promise<NetResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  /** POST 请求 */
  async post<T = any>(path: string, body?: any): Promise<NetResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /** 带自动重试的请求实现 */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, string>,
  ): Promise<NetResponse<T>> {
    let url = this.baseUrl + path;
    if (params) {
      const query = new URLSearchParams(params).toString();
      url += '?' + query;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const options: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        return json as NetResponse<T>;
      } catch (e: any) {
        lastError = e;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    this.bus.emit(NetEvents.REQUEST_FAILED, { url, error: lastError?.message });
    return { code: -1, data: null as any, message: lastError?.message || 'Network error' };
  }
}
