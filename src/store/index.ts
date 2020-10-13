import { KeyValueStore } from "../types";

export class Store implements KeyValueStore {
  public async set(key: string, data: any): Promise<void> {
    return;
  }
  public async get(key: string): Promise<any> {
    return;
  }
  public async remove(key: string): Promise<void> {
    return;
  }
}
