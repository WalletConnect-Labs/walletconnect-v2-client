import * as rpcJsonUtils from "rpc-json-utils";
import { IEvents } from "./events";

export type JsonRpcRequest = rpcJsonUtils.JsonRpcRequest;

export type JsonRpcResult = rpcJsonUtils.JsonRpcResult;

export type JsonRpcError = rpcJsonUtils.JsonRpcError;

export type ErrorResponse = rpcJsonUtils.ErrorResponse;

export abstract class IJsonRpcProvider extends IEvents {
  constructor() {
    super();
  }

  public abstract request(payload: JsonRpcRequest): Promise<any>;
  public abstract connect(opts?: any): Promise<void>;
  public abstract disconnect(opts?: any): Promise<void>;
}
