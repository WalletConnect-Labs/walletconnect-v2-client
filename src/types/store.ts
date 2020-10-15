export abstract class IStore {
  public abstract init(): Promise<any>;
  public abstract set(key: string, data: any): Promise<void>;
  public abstract get(key: string): Promise<any>;
  public abstract del(key: string): Promise<void>;
}
