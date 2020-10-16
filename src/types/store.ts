export abstract class IStore {
  public abstract init(): Promise<any>;
  public abstract set<T = any>(key: string, data: T): Promise<void>;
  public abstract get<T = any>(key: string): Promise<T>;
  public abstract del(key: string): Promise<void>;
}
