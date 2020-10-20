import { JsonRpcRequest } from "rpc-json-utils";

import { IEvents } from "./events";

export abstract class IJsonRpcProvider extends IEvents {
  constructor() {
    super();
  }

  public abstract request(payload: JsonRpcRequest): Promise<any>;
  public abstract connect(params?: any): Promise<void>;
  public abstract disconnect(params?: any): Promise<void>;
}
