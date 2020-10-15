import { IStore } from "../../types";

export class Store implements IStore {
  public async init(): Promise<any> {
    return;
  }

  public async set(key: string, data: any): Promise<void> {
    return;
  }

  public async get(key: string): Promise<any> {
    return;
  }

  public async del(key: string): Promise<void> {
    return;
  }
}
