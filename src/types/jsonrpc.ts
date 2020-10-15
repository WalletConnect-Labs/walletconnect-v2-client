import * as rpcJsonUtils from "rpc-json-utils";

export type JsonRpcRequest = rpcJsonUtils.JsonRpcRequest;

export type JsonRpcResult = rpcJsonUtils.JsonRpcResult;

export type JsonRpcError = rpcJsonUtils.JsonRpcError;

export type ErrorResponse = rpcJsonUtils.ErrorResponse;

export interface JsonRpcProvider {
  on(event: string, listener: any): void;
  once(event: string, listener: any): void;
  off(event: string, listener: any): void;
  request(payload: JsonRpcRequest): Promise<any>;
  connect(opts?: any): Promise<void>;
  disconnect(opts?: any): Promise<void>;
}
