import { EventBus } from './EventBus';
import { NetEvents } from '../events';

export interface NetResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class NetService {
  private static _inst: NetService;
  static get inst(): NetService {
    if (!this._inst) this._inst = new NetService();
    return this._inst;
  }

  private baseUrl: string = '';
  private bus: EventBus = new EventBus();

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  async get<T = any>(path: string, params?: Record<string, string>): Promise<NetResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T = any>(path: string, body?: any): Promise<NetResponse<T>> {
    return this.request<T>('POST', path, body);
  }

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
