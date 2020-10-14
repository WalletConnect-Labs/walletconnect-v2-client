import { IStoreController } from "../../types";

export class StoreController implements IStoreController {
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
