/**
 * Deno 타입 선언 파일
 * Supabase Edge Functions에서 사용되는 Deno API들의 타입 정의
 */

declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
    
    const env: Env;
    
    interface KvEntry<T = unknown> {
      key: string[];
      value: T;
      versionstamp: string;
    }
    
    interface KvListIterator<T = unknown> extends AsyncIterableIterator<KvEntry<T>> {
      [Symbol.asyncIterator](): AsyncIterableIterator<KvEntry<T>>;
    }
    
    interface Kv {
      get<T = unknown>(key: string[]): Promise<KvEntry<T> | null>;
      set(key: string[], value: unknown): Promise<void>;
      delete(key: string[]): Promise<void>;
      list<T = unknown>(selector: { prefix?: string[] }): KvListIterator<T>;
    }
    
    function openKv(): Promise<Kv>;
  }
}

export {};
