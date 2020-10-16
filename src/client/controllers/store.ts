import { IStore } from "../../types";

export interface KeyValue<T> {
  [key: string]: T;
}

export class Store implements IStore {
  public async init(): Promise<any> {
    return;
  }

  public async set<T = any>(key: string, value: T): Promise<void> {
    return;
  }

  public async get<T = any>(key: string): Promise<T> {
    return {} as any;
  }

  public async del(key: string): Promise<void> {
    return;
  }
}
