import * as safeJsonUtils from "safe-json-utils";
import * as rpcPayloadId from "rpc-payload-id";

import { JsonRpcRequest } from "../types";

// -- JSON -------------------------------------------------- //

export const safeJsonParse = safeJsonUtils.safeJsonParse;

export const safeJsonStringify = safeJsonUtils.safeJsonStringify;

// -- id -------------------------------------------------- //

export const payloadId = rpcPayloadId.payloadId;

export function uuid(): string {
  const result: string = ((a?: any, b?: any) => {
    for (
      b = a = "";
      a++ < 36;
      b += (a * 51) & 52 ? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(16) : "-"
    ) {
      // empty
    }
    return b;
  })();
  return result;
}

// -- jsonrpc -------------------------------------------------- //

export function sanitizeJsonRpc(payload: Partial<JsonRpcRequest>) {
  const request: JsonRpcRequest = {
    id: payloadId(),
    jsonrpc: "2.0",
    method: "",
    params: {},
    ...payload,
  };
  if (!(typeof request.method === "string" && !!request.method.trim())) {
    throw new Error(`Invalid or missing method`);
  }
  return request;
}

// -- assert ------------------------------------------------- //

export function assertType(obj: any, key: string, type: string) {
  if (!obj[key] || typeof obj[key] !== type) {
    throw new Error(`Missing or invalid "${key}" param`);
  }
}
