export abstract class KeyValueStore {
  public abstract set(key: string, data: any): Promise<void>;
  public abstract get(key: string): Promise<any>;
  public abstract remove(key: string): Promise<void>;
}
